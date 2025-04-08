import { Components, ComponentValue, EntityID, SchemaOf } from '@mud-classic/recs';
import { packTuple, unpackTuple } from '@mud-classic/utils';

import { formatEntityID } from 'engine/utils';
import { transformIterator } from 'utils/iterators';
import { NetworkComponentUpdate, NetworkEvents } from 'workers/types';
import { IDIndexMap, StateEntry } from './types';

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

// store an event into a StateCache
export function storeEvent<Cm extends Components>(
  stateCache: StateCache,
  {
    component,
    entity,
    value,
    blockNumber,
  }: Omit<NetworkComponentUpdate<Cm>, 'lastEventInTx' | 'txHash'>
) {
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
}

export function storeEvents<Cm extends Components>(
  stateCache: StateCache,
  events: Omit<NetworkComponentUpdate<Cm>, 'lastEventInTx' | 'txHash'>[]
) {
  for (const event of events) {
    storeEvent(stateCache, event);
  }
}

// get an iterable series of NetworkComponentUpdates from a StateCache
export function getEntries<C extends Components>(
  stateCache: StateCache
): IterableIterator<NetworkComponentUpdate<C>> {
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
}
