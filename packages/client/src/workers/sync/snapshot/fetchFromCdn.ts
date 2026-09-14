import {
  ComponentsResponse,
  EntitiesResponse,
  KamigazeServiceClient,
  StateResponse,
} from 'clients/kamigaze';
import { createDecode } from 'engine/encoders';
import { log } from 'utils/logger';
import {
  createStateCache,
  StateCache,
  storeStateBlock,
  storeStateComponents,
  storeStateEntities,
  storeStateValues,
} from '../state';
import { CDN_FULL_THRESHOLD_BLOCKS, fetchStateBlock, MAX_RETRIES, RETRY_DELAYS } from './fetch';

export type StateManifest = {
  nonce: number;
  block: number;
  values: number;
  entities: number;
};

// the exporter is stuck and its chunk set aged out of the bucket while latest.json
// survived, so the manifest points at keys that no longer exist. Never retryable.
class CdnChunkGone extends Error {
  constructor(readonly url: string) {
    super(`[cdn] chunk gone: ${url}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchManifest = async (cdnUrl: string): Promise<StateManifest | undefined> => {
  try {
    const res = await fetch(`${cdnUrl}/latest.json`, { cache: 'no-store' });
    if (!res.ok) {
      log.warn('[cdn] manifest unavailable', { status: res.status });
      return undefined;
    }
    return (await res.json()) as StateManifest;
  } catch (e) {
    log.warn('[cdn] manifest unavailable', e);
    return undefined;
  }
};

/**
 * Decide whether this boot should full-load from the CDN, returning the manifest to
 * load when it should and undefined when the gRPC path should run instead.
 */
export const planCdnLoad = async (
  cdnUrl: string,
  client: KamigazeServiceClient,
  cache: StateCache
): Promise<StateManifest | undefined> => {
  const [manifest, live] = await Promise.all([fetchManifest(cdnUrl), fetchStateBlock(client)]);
  if (!manifest) return undefined;

  // the manifest is up to one export interval old. After a reindex it still carries the
  // previous nonce while the service reports the new one, and its indices are dead.
  if (manifest.nonce !== live.nonce) {
    log.warn('[cdn] manifest nonce differs from live nonce, using gRPC', {
      manifestNonce: manifest.nonce,
      liveNonce: live.nonce,
    });
    return undefined;
  }

  const cold =
    cache.lastKamigazeBlock === 0 ||
    cache.kamigazeNonce !== manifest.nonce ||
    manifest.block - cache.lastKamigazeBlock > CDN_FULL_THRESHOLD_BLOCKS;
  if (!cold) return undefined;

  log.info('[cdn] cold boot: loading full state from CDN', {
    block: manifest.block,
    nonce: manifest.nonce,
    values: manifest.values,
    entities: manifest.entities,
  });
  return manifest;
};

const fetchChunk = async (url: string): Promise<Uint8Array> => {
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      const res = await fetch(url);
      if (res.status === 404 || res.status === 403) throw new CdnChunkGone(url);
      if (!res.ok) throw new Error(`[cdn] chunk ${url} responded ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    } catch (e) {
      if (e instanceof CdnChunkGone) throw e;

      retryCount++;
      if (retryCount > MAX_RETRIES) throw e;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      log.warn(`[cdn] chunk retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`, { url, e });
      await sleep(delay);
    }
  }

  throw new Error(`[cdn] chunk ${url} failed after ${MAX_RETRIES} retries`);
};

// starts every task with at most `limit` in flight, handing back one promise per task
// in task order so callers can consume results in whatever order they need.
const startWithLimit = <T>(tasks: (() => Promise<T>)[], limit = 6): Promise<T>[] => {
  const settle: { resolve: (value: T) => void; reject: (reason: unknown) => void }[] = [];
  const results = tasks.map((_, i) => {
    const result = new Promise<T>((resolve, reject) => (settle[i] = { resolve, reject }));
    // a chunk that fails before its turn to be consumed is still handled here
    result.catch(() => {});
    return result;
  });

  let next = 0;
  const drain = async () => {
    while (next < tasks.length) {
      const i = next++;
      try {
        settle[i].resolve(await tasks[i]());
      } catch (e) {
        settle[i].reject(e);
      }
    }
  };
  for (let i = 0; i < Math.min(limit, tasks.length); i++) void drain();

  return results;
};

/**
 * Load a full state image from the CDN into a fresh StateCache. Components land first
 * (values decode against them), values apply in any order, entities strictly in index
 * order since storeStateEntities only appends at the tail.
 */
export const fetchFromCdn = async (
  cdnUrl: string,
  manifest: StateManifest,
  decode: ReturnType<typeof createDecode>,
  setPercentage: (percentage: number) => void,
  setMessage?: (msg: string) => void,
  retried = false
): Promise<StateCache> => {
  const cache = createStateCache();
  const prefix = `${cdnUrl}/${manifest.nonce}/${manifest.block}`;

  try {
    setMessage?.('Querying for Components');
    const componentBytes = await fetchChunk(`${prefix}/components.pb.gz`);
    storeStateComponents(cache, ComponentsResponse.decode(componentBytes).components);
    cache.lastKamigazeComponent = cache.components.length - 1;
    setPercentage(5);

    setMessage?.('Querying for State');
    const urls = [
      ...Array.from({ length: manifest.values }, (_, i) => `${prefix}/values-${i}.pb.gz`),
      ...Array.from({ length: manifest.entities }, (_, i) => `${prefix}/entities-${i}.pb.gz`),
    ];
    const chunks = startWithLimit(urls.map((url) => () => fetchChunk(url)));
    const valueChunks = chunks.slice(0, manifest.values);
    const entityChunks = chunks.slice(manifest.values);

    let valuesApplied = 0;
    const applyValues = valueChunks.map((chunk) =>
      chunk.then(async (bytes) => {
        await storeStateValues(cache, StateResponse.decode(bytes).state, decode);
        valuesApplied++;
        setPercentage(+(5 + (valuesApplied / manifest.values) * 60).toFixed(1));
      })
    );

    const applyEntitiesInOrder = async () => {
      for (let i = 0; i < entityChunks.length; i++) {
        storeStateEntities(cache, EntitiesResponse.decode(await entityChunks[i]).entities);
        setPercentage(+(65 + ((i + 1) / manifest.entities) * 35).toFixed(1));
      }
    };

    await Promise.all([Promise.all(applyValues), applyEntitiesInOrder()]);

    storeStateBlock(cache, { blockNumber: manifest.block, nonce: manifest.nonce });
    cache.lastKamigazeBlock = manifest.block;
    cache.kamigazeNonce = manifest.nonce;
    cache.lastKamigazeEntity = cache.entities.length - 1;

    return cache;
  } catch (e) {
    if (e instanceof CdnChunkGone && !retried) {
      const next = await fetchManifest(cdnUrl);
      if (next && next.nonce === manifest.nonce && next.block !== manifest.block) {
        log.warn('[cdn] chunk set expired mid-load, restarting from the current manifest', {
          from: manifest.block,
          to: next.block,
        });
        return fetchFromCdn(cdnUrl, next, decode, setPercentage, setMessage, true);
      }
    }
    throw e;
  }
};
