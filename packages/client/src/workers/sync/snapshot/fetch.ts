import { createDecode } from 'engine/encoders';
import { KamigazeServiceClient } from 'engine/types/kamigaze/kamigaze';
import {
  StateCache,
  createStateCache,
  removeStateValues,
  storeStateBlock,
  storeStateComponents,
  storeStateEntities,
  storeStateValues,
} from '../state';

interface FetchOptions {
  stateCache: StateCache;
  kamigazeClient: KamigazeServiceClient;
  decode: ReturnType<typeof createDecode>;
  numChunks?: number;
  setPercentage: (percentage: number) => void;
}

// fetch a state snapshot from Kamigaze and store it in the StateCache
export const fetchSnapshot = async (
  stateCache: StateCache,
  kamigazeClient: KamigazeServiceClient,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage: (percentage: number) => void
): Promise<StateCache> => {
  performance.mark('fetchSnapshot:start');
  let currentBlock = stateCache.lastKamigazeBlock;
  let initialLoad = currentBlock == 0;

  const options: FetchOptions = { stateCache, kamigazeClient, decode, numChunks, setPercentage };

  try {
    performance.mark('getStateBlock:start');
    let BlockResponse = await kamigazeClient.getStateBlock({});
    performance.mark('getStateBlock:end');
    performance.measure('getStateBlock', 'getStateBlock:start', 'getStateBlock:end');

    if (stateCache.kamigazeNonce != BlockResponse.nonce) {
      console.log('New nonce found, full state load required');
      options.stateCache = createStateCache();
      initialLoad = true;
    }

    await fetchComponents(options);
    if (!initialLoad) {
      await fetchStateRemovals(options);
    }
    await fetchStateValues(options);
    await fetchEntities(options);

    performance.mark('storeStateBlock:start');
    storeStateBlock(options.stateCache, BlockResponse);
    options.stateCache.lastKamigazeBlock = BlockResponse.blockNumber;
    options.stateCache.kamigazeNonce = BlockResponse.nonce;
    performance.mark('storeStateBlock:end');
    performance.measure('storeStateBlock', 'storeStateBlock:start', 'storeStateBlock:end');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }

  performance.mark('fetchSnapshot:end');
  performance.measure('fetchSnapshot', 'fetchSnapshot:start', 'fetchSnapshot:end');
  return options.stateCache;
};

// fetch components from Kamigaze and store them in the StateCache
const fetchComponents = async ({ stateCache, kamigazeClient, setPercentage }: FetchOptions) => {
  performance.mark('fetchComponents:start');
  // remove from the cache any component added by the rpc sync
  stateCache.components.splice(stateCache.lastKamigazeComponent + 1);

  performance.mark('getComponents:start');
  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: stateCache.lastKamigazeComponent,
  });
  performance.mark('getComponents:end');
  performance.measure('getComponents', 'getComponents:start', 'getComponents:end');

  performance.mark('storeStateComponents:start');
  storeStateComponents(stateCache, ComponentsResponse.components);
  stateCache.lastKamigazeComponent = stateCache.components.length - 1;
  performance.mark('storeStateComponents:end');
  performance.measure('storeStateComponents', 'storeStateComponents:start', 'storeStateComponents:end');

  setPercentage(5);
  performance.mark('fetchComponents:end');
  performance.measure('fetchComponents', 'fetchComponents:start', 'fetchComponents:end');
};

// fetch entities from Kamigaze and store them in the StateCache
const fetchEntities = async ({
  stateCache,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) => {
  performance.mark('fetchEntities:start');
  // remove from the cache any entity added by the rpc sync
  let percent = 75;
  let delta = 0;
  stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);

  performance.mark('getEntities:start');
  const EntitiesResponse = kamigazeClient.getEntities({
    fromIdx: stateCache.lastKamigazeEntity,
  });

  let chunkCount = 0;
  for await (const responseChunk of EntitiesResponse) {
    performance.mark(`getEntities:chunk${chunkCount}:start`);
    if (delta == 0) delta = 25 / responseChunk.pending;
    percent += delta;
    performance.mark(`storeStateEntities:chunk${chunkCount}:start`);
    storeStateEntities(stateCache, responseChunk.entities);
    performance.mark(`storeStateEntities:chunk${chunkCount}:end`);
    performance.measure(`storeStateEntities:chunk${chunkCount}`, `storeStateEntities:chunk${chunkCount}:start`, `storeStateEntities:chunk${chunkCount}:end`);
    setPercentage(percent);
    performance.mark(`getEntities:chunk${chunkCount}:end`);
    performance.measure(`getEntities:chunk${chunkCount}`, `getEntities:chunk${chunkCount}:start`, `getEntities:chunk${chunkCount}:end`);
    chunkCount++;
  }
  performance.mark('getEntities:end');
  performance.measure('getEntities', 'getEntities:start', 'getEntities:end');

  stateCache.lastKamigazeEntity = stateCache.entities.length - 1;
  performance.mark('fetchEntities:end');
  performance.measure('fetchEntities', 'fetchEntities:start', 'fetchEntities:end');
};

// fetch state removals from Kamigaze and remove them from the StateCache
const fetchStateRemovals = async ({ stateCache, kamigazeClient, setPercentage }: FetchOptions) => {
  performance.mark('fetchStateRemovals:start');
  let percent = 5;
  let delta = 0;
  performance.mark('getStateRemovals:start');
  const StateRemovalsResponse = await kamigazeClient.getState({
    fromBlock: stateCache.lastKamigazeBlock,
    removals: true,
  });
  let chunkCount = 0;
  for await (const responseChunk of StateRemovalsResponse) {
    performance.mark(`getStateRemovals:chunk${chunkCount}:start`);
    if (delta == 0) delta = 10 / responseChunk.pending;
    percent += delta;
    performance.mark(`removeStateValues:chunk${chunkCount}:start`);
    removeStateValues(stateCache, responseChunk.state);
    performance.mark(`removeStateValues:chunk${chunkCount}:end`);
    performance.measure(`removeStateValues:chunk${chunkCount}`, `removeStateValues:chunk${chunkCount}:start`, `removeStateValues:chunk${chunkCount}:end`);
    setPercentage(percent);
    performance.mark(`getStateRemovals:chunk${chunkCount}:end`);
    performance.measure(`getStateRemovals:chunk${chunkCount}`, `getStateRemovals:chunk${chunkCount}:start`, `getStateRemovals:chunk${chunkCount}:end`);
    chunkCount++;
  }
  performance.mark('getStateRemovals:end');
  performance.measure('getStateRemovals', 'getStateRemovals:start', 'getStateRemovals:end');
  performance.mark('fetchStateRemovals:end');
  performance.measure('fetchStateRemovals', 'fetchStateRemovals:start', 'fetchStateRemovals:end');
};

// fetch state values from Kamigaze and store them in the StateCache
const fetchStateValues = async ({
  stateCache,
  kamigazeClient,
  decode,
  setPercentage,
}: FetchOptions) => {
  performance.mark('fetchStateValues:start');
  let percent = 15;
  let delta = 0;
  performance.mark('getStateValues:start');
  const StateValuesResponse = await kamigazeClient.getState({
    fromBlock: stateCache.lastKamigazeBlock,
    removals: false,
  });

  let chunkCount = 0;
  for await (const responseChunk of StateValuesResponse) {
    performance.mark(`getStateValues:chunk${chunkCount}:start`);
    if (delta == 0) delta = 60 / responseChunk.pending;
    percent += delta;
    performance.mark(`storeStateValues:chunk${chunkCount}:start`);
    storeStateValues(stateCache, responseChunk.state, decode);
    performance.mark(`storeStateValues:chunk${chunkCount}:end`);
    performance.measure(`storeStateValues:chunk${chunkCount}`, `storeStateValues:chunk${chunkCount}:start`, `storeStateValues:chunk${chunkCount}:end`);
    setPercentage(percent);
    performance.mark(`getStateValues:chunk${chunkCount}:end`);
    performance.measure(`getStateValues:chunk${chunkCount}`, `getStateValues:chunk${chunkCount}:start`, `getStateValues:chunk${chunkCount}:end`);
    chunkCount++;
  }
  performance.mark('getStateValues:end');
  performance.measure('getStateValues', 'getStateValues:start', 'getStateValues:end');
  performance.mark('fetchStateValues:end');
  performance.measure('fetchStateValues', 'fetchStateValues:start', 'fetchStateValues:end');
};
