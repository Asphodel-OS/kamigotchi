import { packTuple } from '@mud-classic/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Component,
  ComponentsResponse,
  EntitiesResponse,
  Entity,
  KamigazeServiceClient,
  State,
  StateResponse,
} from 'clients/kamigaze';
import { createDecode } from 'engine/encoders';
import { formatEntityID } from 'engine/utils';
import { uint8ArrayToHexString } from 'utils/numbers';
import { createStateCache, getStateCacheEntries, StateCache } from '../state';
import { fetchSnapshot } from './fetch';
import { fetchFromCdn, planCdnLoad, StateManifest } from './fetchFromCdn';

const CDN = 'https://cdn.test';
const NONCE = 7;
const BLOCK = 100;

const components: Component[] = Array.from({ length: 3 }, (_, i) => ({
  idx: i + 1,
  id: new Uint8Array([i + 1]),
}));

const entities: Entity[] = Array.from({ length: 7 }, (_, i) => ({
  idx: i + 1,
  id: new Uint8Array([i + 1]),
}));

// 25 rows over 3 components x 7 entities repeats some pairs, so the payload is derived
// from the pair rather than the row: a real export holds one row per (component, entity)
// and applying the chunks in any order has to land on the same state.
const values: State[] = Array.from({ length: 25 }, (_, i) => {
  const componentIdx = (i % 3) + 1;
  const entityIdx = (i % 7) + 1;
  return {
    packedIdx: packTuple([componentIdx, entityIdx]),
    data: new Uint8Array([componentIdx, entityIdx]),
  };
});

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const valueChunks = chunk(values, 10);
const entityChunks = chunk(entities, 3);

// Mirrors the exporter's key shape: every export owns a prefix, because nonce and block
// alone do not identify an image. The client never composes this, it reads it.
const SLOT = '2026-09-13T20Z';
const prefixFor = (block: number) => `${NONCE}/${block}/${SLOT}`;

const manifestFor = (block: number): StateManifest => ({
  nonce: NONCE,
  block,
  prefix: prefixFor(block),
  values: valueChunks.length,
  entities: entityChunks.length,
});

const manifest = manifestFor(BLOCK);

const chunkBytes = (block: number): Record<string, Uint8Array> => {
  const prefix = `${CDN}/${prefixFor(block)}`;
  const bytes: Record<string, Uint8Array> = {
    [`${prefix}/components.pb.gz`]: ComponentsResponse.encode({ components }).finish(),
  };
  valueChunks.forEach((state, i) => {
    bytes[`${prefix}/values-${i}.pb.gz`] = StateResponse.encode({
      state,
      pending: valueChunks.length - i - 1,
      lastBlockNumber: block,
    }).finish();
  });
  entityChunks.forEach((chunked, i) => {
    bytes[`${prefix}/entities-${i}.pb.gz`] = EntitiesResponse.encode({
      entities: chunked,
      pending: entityChunks.length - i - 1,
    }).finish();
  });
  return bytes;
};

// Component-sensitive on purpose. storeValues decodes with
// stateCache.components[componentIdx], so applying a value chunk before components are
// stored passes undefined to the real decoder, which misses ComponentsSchema and falls
// back to the bool decoder — silently decoding the whole image wrong. A stub that ignored
// its component argument would stay green through exactly that reordering.
const decode = (async (component: string, data: Uint8Array) =>
  `${component}:${uint8ArrayToHexString(data)}`) as unknown as ReturnType<typeof createDecode>;

const noop = () => {};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// the DOM BodyInit type predates the generic Uint8Array, so the cast is the whole gap
const respond = (bytes: Uint8Array) => new Response(bytes as unknown as BodyInit);

const stubFetch = (handler: (url: string) => Promise<Response>) => {
  const spy = vi.fn((input: RequestInfo | URL) => handler(String(input)));
  vi.stubGlobal('fetch', spy);
  return spy;
};

const serve = (bytes: Record<string, Uint8Array>, served: StateManifest = manifest) =>
  stubFetch(async (url) => {
    if (url === `${CDN}/latest.json`) return new Response(JSON.stringify(served));
    const body = bytes[url];
    return body ? respond(body) : new Response(null, { status: 404 });
  });

const fakeClient = (block: number, nonce: number): KamigazeServiceClient =>
  ({
    getStateBlock: async () => ({ blockNumber: block, nonce }),
    getComponents: async () => ({ components }),
    getEntities: async function* () {
      for (let i = 0; i < entityChunks.length; i++) {
        yield { entities: entityChunks[i], pending: entityChunks.length - i - 1 };
      }
    },
    getState: async function* () {
      for (let i = 0; i < valueChunks.length; i++) {
        yield {
          state: valueChunks[i],
          pending: valueChunks.length - i - 1,
          lastBlockNumber: block,
        };
      }
    },
  }) as unknown as KamigazeServiceClient;

// lastStateValuesBlock / lastStateRemovalsBlock are the two fields the CDN path
// deliberately leaves alone (spec 6, step 5): the gRPC path sets them from the chunk
// headers and both are overwritten on the next fetchSnapshot before anything reads them.
const comparable = (cache: StateCache) => ({
  ...cache,
  lastStateValuesBlock: 0,
  lastStateRemovalsBlock: 0,
});

const warmCache = (block: number, nonce: number): StateCache => {
  const cache = createStateCache();
  cache.lastKamigazeBlock = block;
  cache.kamigazeNonce = nonce;
  return cache;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchFromCdn', () => {
  it('produces the same cache as a full gRPC load', async () => {
    serve(chunkBytes(BLOCK));

    const fromCdn = await fetchFromCdn(CDN, manifest, decode, noop);
    const fromGrpc = await fetchSnapshot(
      createStateCache(),
      fakeClient(BLOCK, NONCE),
      decode,
      10,
      noop
    );

    expect(fromCdn.state.size).toBe(new Set(values.map((value) => value.packedIdx)).size);
    expect(comparable(fromCdn)).toEqual(comparable(fromGrpc));
  });

  it('applies entities in index order when they land out of order', async () => {
    const bytes = chunkBytes(BLOCK);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubFetch(async (url) => {
      if (url.endsWith('entities-0.pb.gz')) await sleep(20);
      return respond(bytes[url]);
    });

    const cache = await fetchFromCdn(CDN, manifest, decode, noop);

    expect(cache.entities).toEqual([
      '0x0',
      ...entities.map((entity) => formatEntityID(uint8ArrayToHexString(entity.id))),
    ]);
    expect(warn.mock.calls.flat().join(' ')).not.toContain('does not match tail');
  });

  it('finalises the cache with the manifest block', async () => {
    serve(chunkBytes(BLOCK));

    const cache = await fetchFromCdn(CDN, manifest, decode, noop);

    expect(cache.blockNumber).toBe(BLOCK);
    expect(cache.lastKamigazeBlock).toBe(BLOCK);
    expect(cache.kamigazeNonce).toBe(NONCE);
    expect(cache.lastKamigazeEntity).toBe(cache.entities.length - 1);
    expect(cache.lastKamigazeComponent).toBe(cache.components.length - 1);
    expect(getStateCacheEntries(cache).next().value!.blockNumber).toBe(BLOCK);
  });

  it.each([404, 403])('restarts from a fresh manifest when a chunk is %i', async (status) => {
    const nextBlock = 200;
    const gone = `${CDN}/${prefixFor(BLOCK)}/values-1.pb.gz`;
    const bytes = { ...chunkBytes(BLOCK), ...chunkBytes(nextBlock) };
    const spy = stubFetch(async (url) => {
      if (url === `${CDN}/latest.json`) {
        return new Response(JSON.stringify(manifestFor(nextBlock)));
      }
      if (url === gone) return new Response(null, { status });
      return respond(bytes[url]);
    });

    const cache = await fetchFromCdn(CDN, manifest, decode, noop);

    expect(cache.lastKamigazeBlock).toBe(nextBlock);
    expect(spy.mock.calls.filter(([url]) => String(url) === gone)).toHaveLength(1);
  });

  it('rejects when the re-read manifest points at the same block', async () => {
    const gone = `${CDN}/${prefixFor(BLOCK)}/values-1.pb.gz`;
    const bytes = chunkBytes(BLOCK);
    stubFetch(async (url) => {
      if (url === `${CDN}/latest.json`) return new Response(JSON.stringify(manifest));
      if (url === gone) return new Response(null, { status: 404 });
      return respond(bytes[url]);
    });

    await expect(fetchFromCdn(CDN, manifest, decode, noop)).rejects.toThrow();
  });
});

describe('planCdnLoad', () => {
  it('returns undefined when the manifest cannot be read', async () => {
    stubFetch(async () => {
      throw new Error('offline');
    });

    expect(await planCdnLoad(CDN, fakeClient(BLOCK, NONCE), createStateCache())).toBeUndefined();
  });

  it('returns undefined when the manifest nonce differs from the live nonce', async () => {
    serve(chunkBytes(BLOCK));

    expect(
      await planCdnLoad(CDN, fakeClient(BLOCK, NONCE + 1), createStateCache())
    ).toBeUndefined();
  });

  it('returns undefined for a warm cache within the threshold', async () => {
    serve(chunkBytes(BLOCK));

    expect(
      await planCdnLoad(CDN, fakeClient(BLOCK, NONCE), warmCache(BLOCK - 10, NONCE))
    ).toBeUndefined();
  });

  it('returns the manifest for an empty cache', async () => {
    serve(chunkBytes(BLOCK));

    expect(await planCdnLoad(CDN, fakeClient(BLOCK, NONCE), createStateCache())).toEqual(manifest);
  });

  it('returns the manifest when the cached nonce is stale', async () => {
    serve(chunkBytes(BLOCK));

    expect(
      await planCdnLoad(CDN, fakeClient(BLOCK, NONCE), warmCache(BLOCK - 10, NONCE - 1))
    ).toEqual(manifest);
  });
});
