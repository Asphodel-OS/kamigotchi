import { ComponentValue } from 'engine/recs';

import { debug as parentDebug } from 'workers/debug';
import { StateCache } from './cache';
import { StateStore } from './store';

const debug = parentDebug.extend('StateCache');

// saves a StateCache into an (IndexedDB) Cache
export const toStore = async (store: StateStore, cache: StateCache) => {
  debug('cache store with size', cache.state.size, 'at block', cache.blockNumber);
  await Promise.all([
    store.set('ComponentValues', 'current', cache.state),
    store.set('Mappings', 'components', cache.components),
    store.set('Mappings', 'entities', cache.entities),
    store.set('BlockNumber', 'current', cache.blockNumber),
    store.set('LastKamigazeBlock', 'current', cache.lastKamigazeBlock),
    store.set('LastKamigazeEntity', 'current', cache.lastKamigazeEntity),
    store.set('LastKamigazeComponent', 'current', cache.lastKamigazeComponent),
    store.set('KamigazeNonce', 'current', cache.kamigazeNonce),
  ]);
};

// loads a StateCache from an (IndexedDB) Cache
export const fromStore = async (store: StateStore): Promise<StateCache> => {
  const [
    stateResult,
    blockNumberResult,
    componentsResult,
    entitiesResult,
    lastKamigazeBlockResult,
    lastKamigazeEntityResult,
    lastKamigazeComponentResult,
    kamigazeNonceResult,
  ] = await Promise.all([
    store.get('ComponentValues', 'current'),
    store.get('BlockNumber', 'current'),
    store.get('Mappings', 'components'),
    store.get('Mappings', 'entities'),
    store.get('LastKamigazeBlock', 'current'),
    store.get('LastKamigazeEntity', 'current'),
    store.get('LastKamigazeComponent', 'current'),
    store.get('KamigazeNonce', 'current'),
  ]);

  const state = stateResult ?? new Map<number, ComponentValue>();
  const blockNumber = blockNumberResult ?? 0;
  const components = componentsResult ?? [];
  const entities = entitiesResult ?? [];
  const lastKamigazeBlock = lastKamigazeBlockResult ?? 0;
  const lastKamigazeEntity = lastKamigazeEntityResult ?? 0;
  const lastKamigazeComponent = lastKamigazeComponentResult ?? 0;
  const kamigazeNonce = kamigazeNonceResult ?? 0;

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
};
