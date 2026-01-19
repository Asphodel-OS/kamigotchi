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
  if (Math.random() < 0.25) {
    log.warn('Throwing in purpose')
    throw new Error('[TEST] Random chunk failure (1 in 4)');
  }
};

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Chunk timeout')), ms)),
  ]);
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

    options.stateCache.lastStateValuesBlock =
      options.stateCache.lastStateValuesBlock || options.stateCache.lastKamigazeBlock;
    options.stateCache.lastStateRemovalsBlock =
      options.stateCache.lastStateRemovalsBlock || options.stateCache.lastKamigazeBlock;

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

const fetchEntities = async ({
  stateCache,
  kamigazeClient,
  setPercentage,
}: FetchOptions): Promise<void> => {
  log.debug('[snapshot] fetchEntities started', {
    fromIdx: stateCache.lastKamigazeEntity,
    currentEntitiesCount: stateCache.entities.length,
  });

  stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);

  let retryCount = 0;
  let percent = 75;
  let delta = 0;
  let chunkIndex = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      log.debug('[snapshot] fetchEntities requesting stream', {
        fromIdx: stateCache.lastKamigazeEntity,
      });

      const response = kamigazeClient.getEntities({
        fromIdx: stateCache.lastKamigazeEntity,
      });

      for await (const chunk of response) {
        await withTimeout(async () => {
          if (delta === 0 && chunk.pending > 0) delta = 25 / chunk.pending;

          log.debug('[snapshot] fetchEntities chunk received', {
            chunkIndex,
            entitiesInChunk: chunk.entities.length,
            pending: chunk.pending,
          });

          storeStateEntities(stateCache, chunk.entities);
          stateCache.lastKamigazeEntity = stateCache.entities.length - 1;

          percent += delta;
          setPercentage(Math.min(percent, 100));
          chunkIndex++;
        }, CHUNK_TIMEOUT_MS);

        maybeThrow();
        retryCount = 0;
      }

      log.debug('[snapshot] fetchEntities completed', {
        totalEntities: stateCache.entities.length,
        chunksProcessed: chunkIndex,
      });
      return;
    } catch (error) {
      retryCount++;
      log.debug('[snapshot] fetchEntities error', {
        retryCount,
        lastEntityIdx: stateCache.lastKamigazeEntity,
        error,
      });
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      log.debug(`[snapshot] Entities retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await sleep(delay);

      stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);
    }
  }
};

const fetchStateRemovals = async ({
  stateCache,
  kamigazeClient,
  setPercentage,
}: FetchOptions): Promise<void> => {
  let fromBlock = stateCache.lastStateRemovalsBlock || stateCache.lastKamigazeBlock;
  log.debug('[snapshot] fetchStateRemovals started', { fromBlock });

  let retryCount = 0;
  let percent = 5;
  let delta = 0;
  let chunkIndex = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      fromBlock = stateCache.lastStateRemovalsBlock || stateCache.lastKamigazeBlock;
      log.debug('[snapshot] fetchStateRemovals requesting stream', {
        fromBlock: fromBlock,
      });

      const response = kamigazeClient.getState({
        fromBlock: fromBlock,
        removals: true,
      });

      for await (const chunk of response) {
        await withTimeout(async () => {
          if (delta === 0 && chunk.pending > 0) delta = 10 / chunk.pending;

          log.debug('[snapshot] fetchStateRemovals chunk received', {
            chunkIndex,
            stateEntriesInChunk: chunk.state.length,
            pending: chunk.pending,
            lastBlockNumber: chunk.lastBlockNumber,
          });

          removeStateValues(stateCache, chunk.state);

          if (chunk.lastBlockNumber > stateCache.lastStateRemovalsBlock) {
            stateCache.lastStateRemovalsBlock = chunk.lastBlockNumber;
          }

          percent += delta;
          setPercentage(Math.min(percent, 15));
          chunkIndex++;
        }, CHUNK_TIMEOUT_MS);

        maybeThrow();
        retryCount = 0;
      }

      log.debug('[snapshot] fetchStateRemovals completed', {
        lastStateRemovalsBlock: stateCache.lastStateRemovalsBlock,
        chunksProcessed: chunkIndex,
      });
      return;
    } catch (error) {
      retryCount++;
      log.debug('[snapshot] fetchStateRemovals error', {
        retryCount,
        lastStateRemovalsBlock: stateCache.lastStateRemovalsBlock,
        error,
      });
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      log.debug(`[snapshot] State removals retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await sleep(delay);
    }
  }
};

const fetchStateValues = async ({
  stateCache,
  kamigazeClient,
  decode,
  setPercentage,
}: FetchOptions): Promise<void> => {
  let fromBlock = stateCache.lastStateValuesBlock || stateCache.lastKamigazeBlock;
  log.debug('[snapshot] fetchStateValues started', { fromBlock });

  let retryCount = 0;
  let percent = 15;
  let delta = 0;
  let chunkIndex = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      fromBlock = stateCache.lastStateValuesBlock || stateCache.lastKamigazeBlock
      log.debug('[snapshot] fetchStateValues requesting stream', {
        fromBlock: fromBlock,
      });

      const response = kamigazeClient.getState({
        fromBlock: fromBlock,
        removals: false,
      });

      for await (const chunk of response) {
        await withTimeout(async () => {
          if (delta === 0 && chunk.pending > 0) delta = 60 / chunk.pending;

          log.debug('[snapshot] fetchStateValues chunk received', {
            chunkIndex,
            stateEntriesInChunk: chunk.state.length,
            pending: chunk.pending,
            lastBlockNumber: chunk.lastBlockNumber,
          });

          storeStateValues(stateCache, chunk.state, decode);

          if (chunk.lastBlockNumber > stateCache.lastStateValuesBlock) {
            stateCache.lastStateValuesBlock = chunk.lastBlockNumber;
          }

          percent += delta;
          setPercentage(Math.min(percent, 75));
          chunkIndex++;
        }, CHUNK_TIMEOUT_MS);

        maybeThrow();
        retryCount = 0;
      }

      log.debug('[snapshot] fetchStateValues completed', {
        lastStateValuesBlock: stateCache.lastStateValuesBlock,
        chunksProcessed: chunkIndex,
      });
      return;
    } catch (error) {
      retryCount++;
      log.debug('[snapshot] fetchStateValues error', {
        retryCount,
        lastStateValuesBlock: stateCache.lastStateValuesBlock,
        error,
      });
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      log.debug(`[snapshot] State values retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await sleep(delay);
    }
  }
};
