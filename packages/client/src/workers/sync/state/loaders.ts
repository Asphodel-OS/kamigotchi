import { ComponentValue } from 'engine/recs';

import { log } from 'utils/logger';
import { StateCache } from './cache';
import { StateStore } from './store';

// saves a StateCache into an (IndexedDB) Cache
export const toStore = async (store: StateStore, cache: StateCache) => {
  log.debug('[StateCache] saving to IndexedDB', {
    entities: cache.entities.length,
    components: cache.components.length,
    stateEntries: cache.state.size,
    blockNumber: cache.blockNumber,
    lastKamigazeBlock: cache.lastKamigazeBlock,
  });
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
  log.debug('[StateCache] saved successfully');
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

  log.debug('[StateCache] loaded from IndexedDB', {
    entities: entities.length,
    components: components.length,
    stateEntries: state.size,
    blockNumber,
    lastKamigazeBlock,
  });

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
