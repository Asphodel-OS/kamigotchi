import { createDecode } from 'engine/encoders';
import { KamigazeServiceClient } from 'clients/kamigaze';
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
const RETRY_DELAYS = [1000, 2000, 3000, 5000, 10000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const options: FetchOptions = { stateCache, kamigazeClient, decode, numChunks, setPercentage };

  try {
    let BlockResponse = await kamigazeClient.getStateBlock({});
    if (stateCache.kamigazeNonce != BlockResponse.nonce) {
      console.log('New nonce found, full state load required');
      options.stateCache = createStateCache();
      initialLoad = true;
    }

    options.stateCache.lastStateValuesBlock =
      options.stateCache.lastStateValuesBlock || options.stateCache.lastKamigazeBlock;
    options.stateCache.lastStateRemovalsBlock =
      options.stateCache.lastStateRemovalsBlock || options.stateCache.lastKamigazeBlock;

    await fetchComponents(options);
    if (!initialLoad) {
      await fetchStateRemovals(options);
    }
    await fetchStateValues(options);
    await fetchEntities(options);

    storeStateBlock(options.stateCache, BlockResponse);
    options.stateCache.lastKamigazeBlock = BlockResponse.blockNumber;
    options.stateCache.kamigazeNonce = BlockResponse.nonce;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }

  return options.stateCache;
};

const fetchComponents = async ({ stateCache, kamigazeClient, setPercentage }: FetchOptions) => {
  stateCache.components.splice(stateCache.lastKamigazeComponent + 1);

  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: stateCache.lastKamigazeComponent,
  });

  storeStateComponents(stateCache, ComponentsResponse.components);
  stateCache.lastKamigazeComponent = stateCache.components.length - 1;
  setPercentage(5);
};

const fetchEntities = async ({
  stateCache,
  kamigazeClient,
  setPercentage,
}: FetchOptions): Promise<void> => {
  stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);

  let retryCount = 0;
  let percent = 75;
  let delta = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      const response = kamigazeClient.getEntities({
        fromIdx: stateCache.lastKamigazeEntity,
      });

      for await (const chunk of response) {
        await withTimeout(async () => {
          if (delta === 0 && chunk.pending > 0) delta = 25 / chunk.pending;

          storeStateEntities(stateCache, chunk.entities);
          stateCache.lastKamigazeEntity = stateCache.entities.length - 1;

          percent += delta;
          setPercentage(Math.min(percent, 100));
        }, CHUNK_TIMEOUT_MS);

        retryCount = 0;
      }
      return;
    } catch (error) {
      retryCount++;
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      console.log(`[snapshot] Entities retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
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
  let retryCount = 0;
  let percent = 5;
  let delta = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      const response = kamigazeClient.getState({
        fromBlock: stateCache.lastStateRemovalsBlock || stateCache.lastKamigazeBlock,
        removals: true,
      });

      for await (const chunk of response) {
        await withTimeout(async () => {
          if (delta === 0 && chunk.pending > 0) delta = 10 / chunk.pending;

          removeStateValues(stateCache, chunk.state);

          if (chunk.lastBlockNumber > stateCache.lastStateRemovalsBlock) {
            stateCache.lastStateRemovalsBlock = chunk.lastBlockNumber;
          }

          percent += delta;
          setPercentage(Math.min(percent, 15));
        }, CHUNK_TIMEOUT_MS);

        retryCount = 0;
      }
      return;
    } catch (error) {
      retryCount++;
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      console.log(
        `[snapshot] State removals retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`
      );
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
  let retryCount = 0;
  let percent = 15;
  let delta = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      const response = kamigazeClient.getState({
        fromBlock: stateCache.lastStateValuesBlock || stateCache.lastKamigazeBlock,
        removals: false,
      });

      for await (const chunk of response) {
        await withTimeout(async () => {
          if (delta === 0 && chunk.pending > 0) delta = 60 / chunk.pending;

          storeStateValues(stateCache, chunk.state, decode);

          if (chunk.lastBlockNumber > stateCache.lastStateValuesBlock) {
            stateCache.lastStateValuesBlock = chunk.lastBlockNumber;
          }

          percent += delta;
          setPercentage(Math.min(percent, 75));
        }, CHUNK_TIMEOUT_MS);

        retryCount = 0;
      }
      return;
    } catch (error) {
      retryCount++;
      if (retryCount > MAX_RETRIES) throw error;

      const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
      console.log(`[snapshot] State values retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`);
      await sleep(delay);
    }
  }
};
