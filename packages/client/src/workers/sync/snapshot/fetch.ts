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

// fetch components from Kamigaze and store them in the StateCache
const fetchComponents = async ({ stateCache, kamigazeClient, setPercentage }: FetchOptions) => {
  // remove from the cache any component added by the rpc sync
  stateCache.components.splice(stateCache.lastKamigazeComponent + 1);

  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: stateCache.lastKamigazeComponent,
  });

  storeStateComponents(stateCache, ComponentsResponse.components);
  stateCache.lastKamigazeComponent = stateCache.components.length - 1;
  setPercentage(5);
};

// fetch entities from Kamigaze and store them in the StateCache
const fetchEntities = async ({
  stateCache,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) => {
  // remove from the cache any entity added by the rpc sync
  let percent = 75;
  let delta = 0;
  stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);

  const EntitiesResponse = kamigazeClient.getEntities({
    fromIdx: stateCache.lastKamigazeEntity,
  });

  for await (const responseChunk of EntitiesResponse) {
    if (delta == 0) delta = 35 / responseChunk.pending;
    percent += delta;
    storeStateEntities(stateCache, responseChunk.entities);
    setPercentage(percent);
  }

  stateCache.lastKamigazeEntity = stateCache.entities.length - 1;
};

// fetch state removals from Kamigaze and remove them from the StateCache
const fetchStateRemovals = async ({ stateCache, kamigazeClient, setPercentage }: FetchOptions) => {
  let percent = 5;
  let delta = 0;
  const StateRemovalsResponse = await kamigazeClient.getState({
    fromBlock: stateCache.lastKamigazeBlock,
    removals: true,
  });
  for await (const responseChunk of StateRemovalsResponse) {
    if (delta == 0) delta = 35 / responseChunk.pending;
    percent += delta;
    removeStateValues(stateCache, responseChunk.state);
    setPercentage(percent);
  }
};

// fetch state values from Kamigaze and store them in the StateCache
const fetchStateValues = async ({
  stateCache,
  kamigazeClient,
  decode,
  setPercentage,
}: FetchOptions) => {
  let percent = 40;
  let delta = 0;
  const StateValuesResponse = await kamigazeClient.getState({
    fromBlock: stateCache.lastKamigazeBlock,
    removals: false,
  });

  for await (const responseChunk of StateValuesResponse) {
    if (delta == 0) delta = 35 / responseChunk.pending;
    percent += delta;
    storeStateValues(stateCache, responseChunk.state, decode);
    setPercentage(percent);
  }
};
