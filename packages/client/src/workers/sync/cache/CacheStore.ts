import { Components, ComponentValue, EntityID, SchemaOf } from '@mud-classic/recs';
import { packTuple, unpackTuple } from '@mud-classic/utils';

import { initCache } from 'cache/';
import { ECSStateReply } from 'engine/types/ecs-snapshot/ecs-snapshot';
import { formatEntityID } from 'engine/utils';
import { transformIterator } from 'utils/iterators';
import { debug as parentDebug } from 'workers/debug';
import { NetworkComponentUpdate, NetworkEvents } from 'workers/types';

const debug = parentDebug.extend('CacheStore');

// TODO: either delineate or merge clear responssibilities between CacheStore and ECSCache
export type State = Map<number, ComponentValue>;
export type CacheStore = ReturnType<typeof createCacheStore>;
export type ECSCache = Awaited<ReturnType<typeof getStateCache>>;
type StateReport = {
  blockNumber: number;
  numComponents: number;
  numEntities: number;
  numStateEntries: number;
  kamigaze: {
    lastBlock: number;
    lastEntity: number;
    lastComponent: number;
    kamigazeNonce: number;
  };
};

export function createCacheStore() {
  const components: string[] = [];
  const componentToIndex = new Map<string, number>();
  const entities: string[] = [];
  const entityToIndex = new Map<string, number>();
  const blockNumber = 0;
  const state: State = new Map<number, ComponentValue>();
  const lastKamigazeBlock = 0;
  const lastKamigazeEntity = 0;
  const lastKamigazeComponent = 0;
  const kamigazeNonce = 0;

  return {
    components,
    componentToIndex,
    entities,
    entityToIndex,
    blockNumber,
    state,
    lastKamigazeBlock,
    lastKamigazeEntity,
    lastKamigazeComponent,
    kamigazeNonce,
  };
}

export function storeEvent<Cm extends Components>(
  cacheStore: CacheStore,
  {
    component,
    entity,
    value,
    blockNumber,
  }: Omit<NetworkComponentUpdate<Cm>, 'lastEventInTx' | 'txHash'>
) {
  // Remove the 0 padding from all entityes
  const normalizedEntity = formatEntityID(entity);

  const { components, entities, componentToIndex, entityToIndex, state } = cacheStore;

  // Get component index
  let componentIndex = componentToIndex.get(component);
  if (componentIndex == null) {
    componentIndex = components.push(component) - 1;
    componentToIndex.set(component as string, componentIndex);
  }

  // Get entity index
  let entityIndex = entityToIndex.get(normalizedEntity);
  if (entityIndex == null) {
    entityIndex = entities.push(normalizedEntity) - 1;
    entityToIndex.set(normalizedEntity, entityIndex);
  }

  // Entity index gets the right 24 bits, component index the left 8 bits
  const key = packTuple([componentIndex, entityIndex]);
  if (value == null) state.delete(key);
  else state.set(key, value);

  // Set block number to one less than the last received event's block number
  // (Events are expected to be ordered, so once a new block number appears,
  // the previous block number is done processing)
  cacheStore.blockNumber = blockNumber - 1;
}

export function storeEvents<Cm extends Components>(
  cacheStore: CacheStore,
  events: Omit<NetworkComponentUpdate<Cm>, 'lastEventInTx' | 'txHash'>[]
) {
  for (const event of events) {
    storeEvent(cacheStore, event);
  }
}

export function getCacheStoreEntries<Cm extends Components>(
  cacheStore: CacheStore
): IterableIterator<NetworkComponentUpdate<Cm>> {
  const { blockNumber, state, components, entities } = cacheStore;

  return transformIterator(state.entries(), ([key, value]) => {
    const [componentIndex, entityIndex] = unpackTuple(key);
    const component = components[componentIndex];
    const entity = entities[entityIndex];

    if (component == null || entity == null) {
      console.warn(`KEY: ${key}`);
      console.warn(`Indexes component / entity: ${componentIndex}, ${entityIndex}`);
      throw new Error(`Unknown component / entity: ${component}, ${entity}`);
    }

    const ecsEvent: NetworkComponentUpdate<Cm> = {
      type: NetworkEvents.NetworkComponentUpdate,
      component,
      entity: entity as EntityID,
      value: value as ComponentValue<SchemaOf<Cm[keyof Cm]>>,
      lastEventInTx: false,
      txHash: 'cache',
      blockNumber: blockNumber,
    };

    return ecsEvent;
  });
}

export async function saveCacheStoreToIndexDb(cache: ECSCache, store: CacheStore) {
  debug('store cache with size', store.state.size, 'at block', store.blockNumber);
  await cache.set('ComponentValues', 'current', store.state);
  await cache.set('Mappings', 'components', store.components);
  await cache.set('Mappings', 'entities', store.entities);
  await cache.set('BlockNumber', 'current', store.blockNumber);
  await cache.set('LastKamigazeBlock', 'current', store.lastKamigazeBlock);
  await cache.set('LastKamigazeEntity', 'current', store.lastKamigazeEntity);
  await cache.set('LastKamigazeComponent', 'current', store.lastKamigazeComponent);
  await cache.set('KamigazeNonce', 'current', store.kamigazeNonce);
}

export async function loadIndexDbToCacheStore(cache: ECSCache): Promise<CacheStore> {
  const state =
    (await cache.get('ComponentValues', 'current')) ?? new Map<number, ComponentValue>();
  const blockNumber = (await cache.get('BlockNumber', 'current')) ?? 0;
  const components = (await cache.get('Mappings', 'components')) ?? [];
  const entities = (await cache.get('Mappings', 'entities')) ?? [];
  const componentToIndex = new Map<string, number>();
  const entityToIndex = new Map<string, number>();

  // Init componentToIndex map
  for (let i = 0; i < components.length; i++) {
    componentToIndex.set(components[i]!, i);
  }

  // Init entityToIndex map
  for (let i = 0; i < entities.length; i++) {
    entityToIndex.set(entities[i]!, i);
  }

  const lastKamigazeBlock = (await cache.get('LastKamigazeBlock', 'current')) ?? 0;
  const lastKamigazeEntity = (await cache.get('LastKamigazeEntity', 'current')) ?? 0;
  const lastKamigazeComponent = (await cache.get('LastKamigazeComponent', 'current')) ?? 0;
  const kamigazeNonce = (await cache.get('KamigazeNonce', 'current')) ?? 0;

  return {
    state,
    blockNumber,
    components,
    entities,
    componentToIndex,
    entityToIndex,
    lastKamigazeBlock,
    lastKamigazeEntity,
    lastKamigazeComponent,
    kamigazeNonce,
  };
}

export async function getIndexDBCacheStoreBlockNumber(cache: ECSCache): Promise<number> {
  return (await cache.get('BlockNumber', 'current')) ?? 0;
}

export function getStateCache(
  chainId: number,
  worldAddress: string,
  version: number,
  idb?: IDBFactory
) {
  return initCache<{
    ComponentValues: State;
    BlockNumber: number;
    Mappings: string[];
    Snapshot: ECSStateReply;
    LastKamigazeBlock: number;
    LastKamigazeEntity: number;
    LastKamigazeComponent: number;
    KamigazeNonce: number;
  }>(
    getCacheId('ECSCache', chainId, worldAddress, version), // Store a separate cache for each World contract address
    [
      'ComponentValues',
      'BlockNumber',
      'Mappings',
      'Snapshot',
      'LastKamigazeBlock',
      'LastKamigazeEntity',
      'LastKamigazeComponent',
      'KamigazeNonce',
    ],
    version,
    idb
  );
}

function getCacheId(namespace: string, chainId: number, worldAddress: string, version: number) {
  return `${namespace}-${chainId}-${worldAddress}-v${version}`;
}

// unused
function mergeCacheStores(stores: CacheStore[]): CacheStore {
  const result = createCacheStore();

  // Sort by block number (increasing)
  const sortedStores = [...stores].sort((a, b) => a.blockNumber - b.blockNumber);

  // Insert the cached events into the result store (from stores with low block number to high number)
  for (const store of sortedStores) {
    for (const updateEvent of getCacheStoreEntries(store)) {
      storeEvent(result, updateEvent);
    }
    result.blockNumber = store.blockNumber;
  }

  return result;
}

// gets the state report of the CacheStore
export function getStateReport(cacheStore: CacheStore): StateReport {
  return {
    blockNumber: cacheStore.blockNumber,
    numComponents: cacheStore.components.length,
    numEntities: cacheStore.entities.length,
    numStateEntries: cacheStore.state.size,
    kamigaze: {
      lastBlock: cacheStore.lastKamigazeBlock,
      lastEntity: cacheStore.lastKamigazeEntity,
      lastComponent: cacheStore.lastKamigazeComponent,
      kamigazeNonce: cacheStore.kamigazeNonce,
    },
  };
}
