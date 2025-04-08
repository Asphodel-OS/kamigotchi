import { ComponentValue } from '@mud-classic/recs';

import { debug as parentDebug } from 'workers/debug';
import { StateCache } from './cache';
import { StateStore } from './store';

const debug = parentDebug.extend('StateCache');

// saves a StateCache into an (IndexedDB) Cache
export async function toStore(store: StateStore, cache: StateCache) {
  debug('cache store with size', cache.state.size, 'at block', cache.blockNumber);
  await store.set('ComponentValues', 'current', cache.state);
  await store.set('Mappings', 'components', cache.components);
  await store.set('Mappings', 'entities', cache.entities);
  await store.set('BlockNumber', 'current', cache.blockNumber);
  await store.set('LastKamigazeBlock', 'current', cache.lastKamigazeBlock);
  await store.set('LastKamigazeEntity', 'current', cache.lastKamigazeEntity);
  await store.set('LastKamigazeComponent', 'current', cache.lastKamigazeComponent);
  await store.set('KamigazeNonce', 'current', cache.kamigazeNonce);
}

// loads a StateCache from an (IndexedDB) Cache
export async function fromStore(store: StateStore): Promise<StateCache> {
  const state =
    (await store.get('ComponentValues', 'current')) ?? new Map<number, ComponentValue>();
  const blockNumber = (await store.get('BlockNumber', 'current')) ?? 0;
  const components = (await store.get('Mappings', 'components')) ?? [];
  const entities = (await store.get('Mappings', 'entities')) ?? [];
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

  const lastKamigazeBlock = (await store.get('LastKamigazeBlock', 'current')) ?? 0;
  const lastKamigazeEntity = (await store.get('LastKamigazeEntity', 'current')) ?? 0;
  const lastKamigazeComponent = (await store.get('LastKamigazeComponent', 'current')) ?? 0;
  const kamigazeNonce = (await store.get('KamigazeNonce', 'current')) ?? 0;

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
