import { Components, ComponentValue, EntityID, SchemaOf } from '@mud-classic/recs';
import { packTuple, unpackTuple } from '@mud-classic/utils';

import { createDecode } from 'engine/encoders';
import { BlockResponse, Component, Entity, State } from 'engine/types/kamigaze/kamigaze';
import { formatEntityID } from 'engine/utils';
import { transformIterator } from 'utils/iterators';
import { uint8ArrayToHexString } from 'utils/numbers';
import { NetworkComponentUpdate, NetworkEvents } from 'workers/types';
import { IDIndexMap, StateEntry, StateEvent } from './types';

/**
 * A StateCache is the in-memory object representation of an IndexedDB-based
 * Cache. The naming conflict between the two layers is a bit confusing, so
 * within the context of sync workers, we refer to the direct IndexedDB Cache
 * as a StateStore and the transformed in-memory representation as a StateCache.
 */

export type StateCache = {
  components: string[];
  componentToIndex: IDIndexMap;
  entities: string[];
  entityToIndex: IDIndexMap;
  blockNumber: number;
  state: StateEntry;
  lastKamigazeBlock: number;
  lastKamigazeEntity: number;
  lastKamigazeComponent: number;
  kamigazeNonce: number;
};

// create an empty StateCache
export const create = (): StateCache => {
  return {
    components: [],
    componentToIndex: new Map<string, number>(),
    entities: [],
    entityToIndex: new Map<string, number>(),
    blockNumber: 0,
    state: new Map<number, ComponentValue>(),
    lastKamigazeBlock: 0,
    lastKamigazeEntity: 0,
    lastKamigazeComponent: 0,
    kamigazeNonce: 0,
  };
};

// get an iterable series of NetworkComponentUpdates from the StateCache
export const getEntries = <C extends Components>(
  stateCache: StateCache
): IterableIterator<NetworkComponentUpdate<C>> => {
  const { blockNumber, state, components, entities } = stateCache;

  return transformIterator(state.entries(), ([key, value]) => {
    const [componentIndex, entityIndex] = unpackTuple(key);
    const component = components[componentIndex];
    const entity = entities[entityIndex];

    if (component == null || entity == null) {
      console.warn(`KEY: ${key}`);
      console.warn(`Indexes component / entity: ${componentIndex}, ${entityIndex}`);
      throw new Error(`Unknown component / entity: ${component}, ${entity}`);
    }

    const ecsEvent: NetworkComponentUpdate<C> = {
      type: NetworkEvents.NetworkComponentUpdate,
      component,
      entity: entity as EntityID,
      value: value as ComponentValue<SchemaOf<C[keyof C]>>,
      lastEventInTx: false,
      txHash: 'cache',
      blockNumber: blockNumber,
    };

    return ecsEvent;
  });
};

// store a raw State event into the StateCache
export const storeEvent = (stateCache: StateCache, event: StateEvent) => {
  const { component, entity, value, blockNumber } = event;

  // Remove the 0 padding from all entityes
  const normalizedEntity = formatEntityID(entity);

  const { components, entities, componentToIndex, entityToIndex, state } = stateCache;

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
  stateCache.blockNumber = blockNumber - 1;
};

// store multiple raw State events into the StateCache at once
export const storeEvents = (stateCache: StateCache, events: StateEvent[]) => {
  for (const event of events) {
    storeEvent(stateCache, event);
  }
};

// cache the block number of a Kamigaze response
export const storeBlock = (stateCache: StateCache, block: BlockResponse) => {
  stateCache.blockNumber = block.blockNumber;
  console.log(`Stored block ${block.blockNumber}`);
};

// cache components received from Kamigaze
export const storeComponents = (stateCache: StateCache, components: Component[]) => {
  const numReceived = components.length;
  if (typeof components === 'undefined' || numReceived == 0) {
    console.log('No new components to store');
    return;
  }

  // prime the cache if Component Store is empty
  const cacheComps = stateCache.components;
  const numInitial = cacheComps.length;
  if (numInitial == 0) cacheComps.push('0x0');

  // process the received components
  for (const component of components) {
    const index = component.idx;
    const tail = cacheComps.length; // current length of cache
    if (index == tail) {
      const hexID = uint8ArrayToHexString(component.id);
      cacheComps.push(hexID);
      stateCache.componentToIndex.set(hexID, index);
    } else {
      console.warn(`Component index ${index} does not match tail of list ${tail}`);
    }
  }

  // log stats
  const numTotal = cacheComps.length;
  const diff = numTotal - numInitial;
  console.log(`Components: received ${numReceived}, diff ${diff}, total ${numTotal}`);
};

// cache entities received from Kamigaze
export const storeEntities = (stateCache: StateCache, entities: Entity[]) => {
  const numReceived = entities.length;
  if (typeof entities === 'undefined' || numReceived == 0) {
    console.log('No new entities to store');
    return;
  }

  // prime the cache if Entity Store is empty
  const cacheEntities = stateCache.entities;
  const numInitial = cacheEntities.length;
  if (numInitial == 0) cacheEntities.push('0x0');

  // process the received entities
  for (const entity of entities) {
    const index = entity.idx;
    const tail = cacheEntities.length; // current length of cache
    if (index == tail) {
      const hexID = uint8ArrayToHexString(entity.id);
      cacheEntities.push(hexID);
      stateCache.entityToIndex.set(hexID, index);
    } else {
      console.warn(`Entity index ${index} does not match tail of list ${tail}`);
    }
  }

  // log stats
  const numTotal = cacheEntities.length;
  const diff = numTotal - numInitial;
  console.log(`Entities: received ${numReceived}, diff ${diff}, total ${numTotal}`);
};

// decode and cache values received from Kamigaze
export const storeValues = async (
  stateCache: StateCache,
  values: State[],
  decode: ReturnType<typeof createDecode>
) => {
  const numReceived = values.length;
  if (numReceived == 0) {
    console.log(`No new values to store`);
    return;
  }

  // get initial state
  const valueCache = stateCache.state;
  const numInitial = valueCache.size;

  // process new values
  for (const event of values) {
    const { packedIdx, data } = event;
    const componentIdx = unpackTuple(packedIdx)[0];
    const value = await decode(stateCache.components[componentIdx], data);
    valueCache.set(packedIdx, value);
  }

  //
  const numTotal = valueCache.size;
  const diff = numTotal - numInitial;
  console.log(`Values: received ${numReceived}, diff ${diff}, total ${numTotal}`);
};

// delete state entries indicated by Kamigaze
export const removeValues = (stateCache: StateCache, values: State[]) => {
  const numReceived = values.length;
  if (numReceived == 0) {
    console.log(`No new values to remove`);
    return;
  }

  // get initial state
  const valueCache = stateCache.state;
  const numInitial = valueCache.size;

  // process value removals
  for (const event of values) {
    const { packedIdx } = event;
    valueCache.delete(packedIdx);
  }

  // log stats
  const numTotal = valueCache.size;
  const diff = numTotal - numInitial;
  console.log(`Values (Removal): received ${numReceived}, diff ${diff}, total ${numTotal}`);
};
