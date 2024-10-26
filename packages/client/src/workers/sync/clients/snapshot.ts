import { createChannel, createClient } from 'nice-grpc-web';

import { KamigazeServiceClient, KamigazeServiceDefinition } from 'engine/types/kamigaze/kamigaze';
import { CacheStore } from '../cache';
import {
  removeValues,
  storeBlock,
  storeComponents,
  storeEntities,
  storeValues,
} from '../cache/operations';
import { createDecode } from '../utils';

/**
 * KAMIGAZE INTEGRATION
 */

export function createSnapshotClient(url: string): KamigazeServiceClient {
  return createClient(KamigazeServiceDefinition, createChannel(url));
}

// fetches the partial state snapshot from kamigaze
export async function fetchStateFromKamigaze(
  cacheStore: CacheStore,
  kamigazeClient: KamigazeServiceClient,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage?: (percentage: number) => void
): Promise<CacheStore> {
  const chunkPercentage = Math.ceil(100 / numChunks);

  let currentBlock = cacheStore.lastKamigazeBlock;
  let initialLoad = currentBlock == 0;

  let BlockResponse = await kamigazeClient.getStateBlock({});
  storeBlock(cacheStore, BlockResponse);
  cacheStore.lastKamigazeBlock = BlockResponse.blockNumber;

  // Components
  // remove from the cache any component added by the rpc sync
  cacheStore.components.splice(cacheStore.lastKamigazeComponent + 1);
  let ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: cacheStore.lastKamigazeComponent,
  });
  storeComponents(cacheStore, ComponentsResponse.components);
  cacheStore.lastKamigazeComponent = cacheStore.components.length - 1;

  // State Removal
  if (!initialLoad) {
    let StateRemovalsReponse = await kamigazeClient.getState({
      fromBlock: currentBlock,
      numChunks: numChunks,
      removals: true,
    });
    for await (const responseChunk of StateRemovalsReponse) {
      removeValues(cacheStore, responseChunk.state);
    }
  }

  // State Values
  let StateValuesResponse = await kamigazeClient.getState({
    fromBlock: currentBlock,
    numChunks: numChunks,
    removals: false,
  });
  for await (const responseChunk of StateValuesResponse) {
    storeValues(cacheStore, responseChunk.state, decode);
  }

  // Entities
  let EntitiesResponse = kamigazeClient.getEntities({
    fromIdx: cacheStore.lastKamigazeEntity,
    numChunks: numChunks,
  });
  // remove from the cache any entity added by the rpc sync
  cacheStore.entities.splice(cacheStore.lastKamigazeEntity + 1);
  for await (const responseChunk of EntitiesResponse) {
    storeEntities(cacheStore, responseChunk.entities);
  }
  cacheStore.lastKamigazeEntity = cacheStore.entities.length - 1;

  return cacheStore;
}
