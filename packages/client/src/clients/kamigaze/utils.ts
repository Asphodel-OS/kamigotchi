import { createChannel, createClient } from 'nice-grpc-web';

import { grpc } from '@improbable-eng/grpc-web';
import { removeValues, storeComponents, storeEntities, storeValues } from 'cache/state/utils';
import { createDecode } from 'engine/encoders';
import { CacheStore, createStateCache } from 'workers/sync/cache';
import { KamigazeServiceClient, KamigazeServiceDefinition } from './proto';

interface FetchOptions {
  cacheStore: CacheStore;
  kamigazeClient: KamigazeServiceClient;
  decode: ReturnType<typeof createDecode>;
  numChunks?: number;
  setPercentage: (percentage: number) => void;
}

export function createSnapshotClient(url: string): KamigazeServiceClient {
  return createClient(KamigazeServiceDefinition, createChannel(url, grpc.WebsocketTransport()));
}

export async function fetchStateFromKamigaze(
  cacheStore: CacheStore,
  kamigazeClient: KamigazeServiceClient,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage: (percentage: number) => void
): Promise<CacheStore> {
  let currentBlock = cacheStore.lastKamigazeBlock;
  let initialLoad = currentBlock == 0;

  const options: FetchOptions = { cacheStore, kamigazeClient, decode, numChunks, setPercentage };

  //block
  let BlockResponse = await kamigazeClient.getStateBlock({});
  if (cacheStore.kamigazeNonce != BlockResponse.nonce) {
    console.log('New nonce found, full state load required');
    options.cacheStore = createStateCache();
    initialLoad = true;
  }

  try {
    await fetchComponents(options);
    if (!initialLoad) await fetchStateRemovals(options);
    await fetchStateValues(options);
    await fetchEntities(options);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }

  cacheStore.blockNumber = BlockResponse.blockNumber; // store the block number
  cacheStore.lastKamigazeBlock = BlockResponse.blockNumber;
  cacheStore.kamigazeNonce = BlockResponse.nonce;

  return cacheStore;
}

async function fetchComponents({ cacheStore, kamigazeClient, setPercentage }: FetchOptions) {
  // remove from the cache any component added by the rpc sync
  cacheStore.components.splice(cacheStore.lastKamigazeComponent + 1);

  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: cacheStore.lastKamigazeComponent,
  });

  storeComponents(cacheStore, ComponentsResponse.components);
  cacheStore.lastKamigazeComponent = cacheStore.components.length - 1;
  setPercentage(5);
}

// fetch removals of state from kamigaze
async function fetchStateRemovals({
  cacheStore,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  let percent = 5;
  const StateRemovalsResponse = await kamigazeClient.getState({
    fromBlock: cacheStore.lastKamigazeBlock,
    numChunks,
    removals: true,
  });
  for await (const responseChunk of StateRemovalsResponse) {
    removeValues(cacheStore, responseChunk.state);
    setPercentage(percent);
    percent += 3;
  }
}

// fetch new state values from kamigaze
async function fetchStateValues({
  cacheStore,
  kamigazeClient,
  decode,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  let percent = 40;
  const StateValuesResponse = await kamigazeClient.getState({
    fromBlock: cacheStore.lastKamigazeBlock,
    numChunks,
    removals: false,
  });

  for await (const responseChunk of StateValuesResponse) {
    storeValues(cacheStore, responseChunk.state, decode);
    setPercentage(percent);
    percent += 3;
  }
}

// fetch any new entities from kamigaze
async function fetchEntities({
  cacheStore,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  // remove from the cache any entity added by the rpc sync
  let percent = 75;
  cacheStore.entities.splice(cacheStore.lastKamigazeEntity + 1);

  const EntitiesResponse = kamigazeClient.getEntities({
    fromIdx: cacheStore.lastKamigazeEntity,
    numChunks,
  });

  for await (const responseChunk of EntitiesResponse) {
    storeEntities(cacheStore, responseChunk.entities);
    setPercentage(percent);
    percent += 3;
  }

  cacheStore.lastKamigazeEntity = cacheStore.entities.length - 1;
}
