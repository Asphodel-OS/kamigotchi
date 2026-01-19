import { createDecode } from 'engine/encoders';
import { KamigazeServiceClient } from 'clients/kamigaze';
import { log } from 'utils/logger';
import {
  StateCache,
  createStateCache,
  removeStateValues,
  storeStateBlock,
  storeStateComponents,
  storeStateEntities,
  storeStateValues,
} from '../state';

const CHUNK_TIMEOUT_MS = 30000;
const MAX_RETRIES = 20;
const RETRY_DELAYS = [10000, 10000, 10000, 10000, 10000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const maybeThrow = () => {
  if (Math.random() < 0.1) {
    log.warn('[snapshot] Throwing in purpose')
    throw new Error('[snapshot] [TEST] Random chunk failure (1 in 5)');
  }
};

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Chunk timeout')), ms)),
  ]);
}

interface StreamingFetchOptions<TChunk> {
  name: string;
  createStream: () => AsyncIterable<TChunk>;
  processChunk: (chunk: TChunk) => void;
  getProgress: (chunk: TChunk) => { pending: number };
  getChunkLogData?: (chunk: TChunk, chunkIndex: number) => Record<string, unknown>;
  progressRange: { start: number; end: number };
  setPercentage: (percentage: number) => void;
  onRetry?: () => void;
}

async function fetchWithRetry<TChunk>({
  name,
  createStream,
  processChunk,
  getProgress,
  getChunkLogData,
  progressRange,
  setPercentage,
  onRetry,
}: StreamingFetchOptions<TChunk>): Promise<void> {
  let retryCount = 0;
  let percent = progressRange.start;
  let delta = 0;
  let chunkIndex = 0;
  const progressSpan = progressRange.end - progressRange.start;

  while (retryCount <= MAX_RETRIES) {
    try {
      log.debug(`[snapshot] ${name} requesting stream`);
      const response = createStream();

      for await (const chunk of response) {
        await withTimeout(async () => {
          const { pending } = getProgress(chunk);
          if (delta === 0 && pending > 0) delta = progressSpan / pending;

          if (getChunkLogData) {
            log.debug(`[snapshot] ${name} chunk received`, getChunkLogData(chunk, chunkIndex));
          }

          processChunk(chunk);

          percent += delta;
          setPercentage(Math.min(percent, progressRange.end));
          chunkIndex++;
        }, CHUNK_TIMEOUT_MS);
        maybeThrow()
        retryCount = 0;
      }

      log.debug(`[snapshot] ${name} completed`, { chunksProcessed: chunkIndex });
      return;
    } catch (error) {
      retryCount++;
      log.debug(`[snapshot] ${name} error`, { retryCount, error });
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      log.debug(`[snapshot] ${name} retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await sleep(delay);

      onRetry?.();
    }
  }
}

interface FetchOptions {
  stateCache: StateCache;
  kamigazeClient: KamigazeServiceClient;
  decode: ReturnType<typeof createDecode>;
  numChunks?: number;
  setPercentage: (percentage: number) => void;
}

export const fetchSnapshot = async (
  stateCache: StateCache,
  kamigazeClient: KamigazeServiceClient,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage: (percentage: number) => void
): Promise<StateCache> => {
  let currentBlock = stateCache.lastKamigazeBlock;
  let initialLoad = currentBlock == 0;

  log.debug('[snapshot] fetchSnapshot started', {
    currentBlock,
    initialLoad,
    numChunks,
    lastStateValuesBlock: stateCache.lastStateValuesBlock,
    lastStateRemovalsBlock: stateCache.lastStateRemovalsBlock,
  });

  const options: FetchOptions = { stateCache, kamigazeClient, decode, numChunks, setPercentage };

  try {
    log.debug('[snapshot] Fetching state block');
    let BlockResponse = await fetchStateBlock(kamigazeClient);
    log.debug('[snapshot] State block received', {
      blockNumber: BlockResponse.blockNumber,
      nonce: BlockResponse.nonce,
      cachedNonce: stateCache.kamigazeNonce,
    });

    if (stateCache.kamigazeNonce != BlockResponse.nonce) {
      log.debug('[snapshot] Nonce mismatch, full state load required');
      options.stateCache = createStateCache();
      initialLoad = true;
    }
                
    options.stateCache.lastStateValuesBlock = options.stateCache.lastKamigazeBlock;                  
    options.stateCache.lastStateRemovalsBlock = options.stateCache.lastKamigazeBlock;  

    log.debug('[snapshot] Starting fetchComponents');
    await fetchComponents(options);

    if (!initialLoad) {
      log.debug('[snapshot] Starting fetchStateRemovals (incremental load)');
      await fetchStateRemovals(options);
    } else {
      log.debug('[snapshot] Skipping fetchStateRemovals (initial load)');
    }

    log.debug('[snapshot] Starting fetchStateValues');
    await fetchStateValues(options);

    log.debug('[snapshot] Starting fetchEntities');
    await fetchEntities(options);

    storeStateBlock(options.stateCache, BlockResponse);
    options.stateCache.lastKamigazeBlock = BlockResponse.blockNumber;
    options.stateCache.kamigazeNonce = BlockResponse.nonce;

    log.debug('[snapshot] fetchSnapshot completed', {
      finalBlock: options.stateCache.lastKamigazeBlock,
      entitiesCount: options.stateCache.entities.length,
      componentsCount: options.stateCache.components.length,
    });
  } catch (error) {
    log.debug('[snapshot] fetchSnapshot error', { error });
    throw error;
  }

  return options.stateCache;
};

const fetchStateBlock = async (kamigazeClient: KamigazeServiceClient) => {
  let retryCount = 0;
  log.debug('[snapshot] fetchStateBlock started');

  while (retryCount <= MAX_RETRIES) {
    try {
      const result = await kamigazeClient.getStateBlock({});
      log.debug('[snapshot] fetchStateBlock succeeded', {
        blockNumber: result.blockNumber,
        nonce: result.nonce,
      });
      return result;
    } catch (error) {
      retryCount++;
      log.debug('[snapshot] fetchStateBlock error', { retryCount, error });
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      log.debug(`[snapshot] State block retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await sleep(delay);
    }
  }

  throw new Error('Failed to fetch state block after max retries');
};

const fetchComponents = async ({ stateCache, kamigazeClient, setPercentage }: FetchOptions) => {
  log.debug('[snapshot] fetchComponents started', {
    fromIdx: stateCache.lastKamigazeComponent,
  });

  stateCache.components.splice(stateCache.lastKamigazeComponent + 1);

  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: stateCache.lastKamigazeComponent,
  });

  log.debug('[snapshot] fetchComponents received', {
    receivedCount: ComponentsResponse.components.length,
  });

  storeStateComponents(stateCache, ComponentsResponse.components);
  stateCache.lastKamigazeComponent = stateCache.components.length - 1;

  log.debug('[snapshot] fetchComponents completed', {
    totalComponents: stateCache.components.length,
  });
  setPercentage(5);
};

async function fetchEntities({
  stateCache,
  kamigazeClient,
  setPercentage,
}: FetchOptions): Promise<void> {
  log.debug('[snapshot] fetchEntities started', {
    fromIdx: stateCache.lastKamigazeEntity,
    currentEntitiesCount: stateCache.entities.length,
  });

  stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);

  await fetchWithRetry({
    name: 'fetchEntities',
    createStream: () => kamigazeClient.getEntities({ fromIdx: stateCache.lastKamigazeEntity }),
    processChunk: (chunk) => {
      storeStateEntities(stateCache, chunk.entities);
      stateCache.lastKamigazeEntity = stateCache.entities.length - 1;
    },
    getProgress: (chunk) => ({ pending: chunk.pending }),
    getChunkLogData: (chunk, chunkIndex) => ({
      chunkIndex,
      entitiesInChunk: chunk.entities.length,
      pending: chunk.pending,
    }),
    progressRange: { start: 75, end: 100 },
    setPercentage,
    onRetry: () => stateCache.entities.splice(stateCache.lastKamigazeEntity + 1),
  });
}

async function fetchStateRemovals({
  stateCache,
  kamigazeClient,
  setPercentage,
}: FetchOptions): Promise<void> {
  log.debug('[snapshot] fetchStateRemovals started', {
    fromBlock: stateCache.lastStateRemovalsBlock || stateCache.lastKamigazeBlock,
  });

  await fetchWithRetry({
    name: 'fetchStateRemovals',
    createStream: () =>
      kamigazeClient.getState({
        fromBlock: stateCache.lastStateRemovalsBlock || stateCache.lastKamigazeBlock,
        removals: true,
      }),
    processChunk: (chunk) => {
      removeStateValues(stateCache, chunk.state);
      if (chunk.lastBlockNumber > stateCache.lastStateRemovalsBlock) {
        stateCache.lastStateRemovalsBlock = chunk.lastBlockNumber;
      }
    },
    getProgress: (chunk) => ({ pending: chunk.pending }),
    getChunkLogData: (chunk, chunkIndex) => ({
      chunkIndex,
      stateEntriesInChunk: chunk.state.length,
      pending: chunk.pending,
      lastBlockNumber: chunk.lastBlockNumber,
    }),
    progressRange: { start: 5, end: 15 },
    setPercentage,
  });
}

async function fetchStateValues({
  stateCache,
  kamigazeClient,
  decode,
  setPercentage,
}: FetchOptions): Promise<void> {
  log.debug('[snapshot] fetchStateValues started', {
    fromBlock: stateCache.lastStateValuesBlock || stateCache.lastKamigazeBlock,
  });

  await fetchWithRetry({
    name: 'fetchStateValues',
    createStream: () =>
      kamigazeClient.getState({
        fromBlock: stateCache.lastStateValuesBlock || stateCache.lastKamigazeBlock,
        removals: false,
      }),
    processChunk: (chunk) => {
      storeStateValues(stateCache, chunk.state, decode);
      if (chunk.lastBlockNumber > stateCache.lastStateValuesBlock) {
        stateCache.lastStateValuesBlock = chunk.lastBlockNumber;
      }
    },
    getProgress: (chunk) => ({ pending: chunk.pending }),
    getChunkLogData: (chunk, chunkIndex) => ({
      chunkIndex,
      stateEntriesInChunk: chunk.state.length,
      pending: chunk.pending,
      lastBlockNumber: chunk.lastBlockNumber,
    }),
    progressRange: { start: 15, end: 75 },
    setPercentage,
  });
}
