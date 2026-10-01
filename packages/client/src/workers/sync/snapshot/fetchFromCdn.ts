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
import {
  CDN_FULL_THRESHOLD_BLOCKS,
  CHUNK_TIMEOUT_MS,
  fetchStateBlock,
  MAX_RETRIES,
  RETRY_DELAYS,
} from './fetch';

export type StateManifest = {
  nonce: number;
  block: number;
  // Key prefix of this export's chunk set, taken verbatim rather than composed here. Nonce
  // and block do not identify an image on their own, so the exporter gives each export its
  // own prefix and the layout stays its business alone.
  prefix: string;
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

// The manifest gates the whole path decision and is under 100 bytes, so it gets a much
// tighter budget than a chunk: a stalled read here is dead time before the gRPC fallback.
const MANIFEST_TIMEOUT_MS = 5000;

// Chunk counts are load bearing in a way a bad value cannot announce: fetchFromCdn derives
// its request list from them, so a missing or zero count fetches nothing, raises no 404, and
// still finalises the cache at manifest.block. The client would then bridge forward from a
// block whose state it never loaded and stay silently incomplete. A malformed prefix is
// self-correcting by comparison, since it 404s into the chunk-gone path.
//
// Every count is > 0 on any published manifest: the exporter refuses to run until
// GetLatestStateBlock() > 0, so there is always at least one values and one entities chunk.
// Anything else is corruption, and rejecting it falls back to gRPC.
const isValidManifest = (value: unknown): value is StateManifest => {
  const m = value as Partial<StateManifest> | null;
  const positiveInt = (n: unknown): boolean => Number.isInteger(n) && (n as number) > 0;

  return (
    !!m &&
    typeof m.prefix === 'string' &&
    m.prefix.length > 0 &&
    positiveInt(m.nonce) &&
    positiveInt(m.block) &&
    positiveInt(m.values) &&
    positiveInt(m.entities)
  );
};

export const fetchManifest = async (cdnUrl: string): Promise<StateManifest | undefined> => {
  try {
    const res = await fetch(`${cdnUrl}/latest.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      log.warn('[cdn] manifest unavailable', { status: res.status });
      return undefined;
    }

    const parsed = await res.json();
    if (!isValidManifest(parsed)) {
      log.warn('[cdn] manifest malformed, using gRPC', { manifest: parsed });
      return undefined;
    }
    return parsed;
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
      const res = await fetch(url, { signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS) });
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
  const prefix = `${cdnUrl}/${manifest.prefix}`;

  // Fetching and applying overlap, so phase marks cannot separate them the way the
  // Worker's connecting/setup/backfill marks do. These are accumulated instead, and the
  // sums deliberately do not add up to wall clock. Read them as:
  //   applyMs vs wallMs  — applying is single-threaded and additive, so if the two are
  //                        close then decoding is the whole story and the network is not
  //   fetchMs            — inflated whenever the thread is busy, since it includes waiting
  //                        for JS to read the body. High fetchMs alongside high applyMs
  //                        means blocking, not a slow link
  //   protoMs vs valuesApplyMs — protobuf parse against the per-row ABI decode
  const t = {
    fetchMs: 0,
    protoMs: 0,
    valuesApplyMs: 0,
    entitiesApplyMs: 0,
    valueRows: 0,
    entityRows: 0,
    bytes: 0,
  };
  const wallStart = performance.now();
  const timedFetch = (url: string) => async () => {
    const started = performance.now();
    const bytes = await fetchChunk(url);
    t.fetchMs += performance.now() - started;
    t.bytes += bytes.byteLength;
    return bytes;
  };

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
    const chunks = startWithLimit(urls.map(timedFetch));
    const valueChunks = chunks.slice(0, manifest.values);
    const entityChunks = chunks.slice(manifest.values);

    // Values and entities apply concurrently, so two writers sharing one percentage cannot
    // own separate ranges: entities finish roughly 25x sooner, so they used to race the bar
    // to 100 before the values snapped it back and left it stranded at 65 when the load
    // finished. One function reading both counters is monotonic by construction, since
    // neither counter ever decreases.
    //
    // The split is weighted by where the time goes, not by chunk count. A measured cold
    // boot spends 36.3s in values against 1.4s in entities, so dividing the bar evenly
    // across nine chunks would sprint through five of them and stall on the rest.
    let valuesApplied = 0;
    let entitiesApplied = 0;
    const reportProgress = () => {
      const values = (valuesApplied / manifest.values) * 90;
      const entities = (entitiesApplied / manifest.entities) * 5;
      setPercentage(+(5 + values + entities).toFixed(1));
    };

    const applyValues = valueChunks.map((chunk) =>
      chunk.then(async (bytes) => {
        const protoStart = performance.now();
        const state = StateResponse.decode(bytes).state;
        t.protoMs += performance.now() - protoStart;

        const applyStart = performance.now();
        storeStateValues(cache, state, decode);
        t.valuesApplyMs += performance.now() - applyStart;
        t.valueRows += state.length;

        valuesApplied++;
        reportProgress();
      })
    );

    const applyEntitiesInOrder = async () => {
      for (let i = 0; i < entityChunks.length; i++) {
        const bytes = await entityChunks[i];
        const protoStart = performance.now();
        const entities = EntitiesResponse.decode(bytes).entities;
        t.protoMs += performance.now() - protoStart;

        const applyStart = performance.now();
        storeStateEntities(cache, entities);
        t.entitiesApplyMs += performance.now() - applyStart;
        t.entityRows += entities.length;

        entitiesApplied++;
        reportProgress();
      }
    };

    await Promise.all([Promise.all(applyValues), applyEntitiesInOrder()]);

    const wallMs = performance.now() - wallStart;
    const applyMs = t.valuesApplyMs + t.entitiesApplyMs;
    log.info('[cdn] load profile', {
      wallSeconds: +(wallMs / 1000).toFixed(2),
      applySeconds: +(applyMs / 1000).toFixed(2),
      applyShareOfWall: `${((applyMs / wallMs) * 100).toFixed(0)}%`,
      valuesApplySeconds: +(t.valuesApplyMs / 1000).toFixed(2),
      entitiesApplySeconds: +(t.entitiesApplyMs / 1000).toFixed(2),
      protoParseSeconds: +(t.protoMs / 1000).toFixed(2),
      fetchSecondsInflatedByBlocking: +(t.fetchMs / 1000).toFixed(2),
      valueRows: t.valueRows,
      entityRows: t.entityRows,
      microsecondsPerValueRow: +((t.valuesApplyMs * 1000) / Math.max(t.valueRows, 1)).toFixed(1),
      megabytes: +(t.bytes / 1e6).toFixed(1),
      megabytesPerSecond: +(t.bytes / 1e6 / (wallMs / 1000)).toFixed(1),
    });

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
