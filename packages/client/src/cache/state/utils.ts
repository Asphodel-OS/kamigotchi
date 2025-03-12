import { unpackTuple } from '@mud-classic/utils';

import { Component, Entity, State } from 'clients/kamigaze/proto';
import { createDecode } from 'engine/encoders';
import { uint8ArrayToHexString } from 'utils/numbers';
import { CacheStore } from 'workers/sync/cache';

export function storeComponents(cacheStore: CacheStore, components: Component[]) {
  if (typeof components === 'undefined') {
    console.log('No components to store');
    return;
  }
  if (cacheStore.components.length == 0) {
    cacheStore.components.push('0x0');
  }
  for (const component of components) {
    var hexId = uint8ArrayToHexString(component.id);

    //CHECK INDEX
    if (component.idx != cacheStore.components.length) {
      console.log(
        `Component.IDX ${component.idx} does not mach tail of list${cacheStore.components.length}`
      );
      continue;
    }

    cacheStore.components.push(hexId);
    cacheStore.componentToIndex.set(hexId, component.idx);
  }
  console.log('Stored components: ' + cacheStore.components.length);
}

// store entities into the cache store
export function storeEntities(cacheStore: CacheStore, entities: Entity[]) {
  if (typeof entities === 'undefined') {
    console.log('No components to store');
    return;
  }
  if (cacheStore.entities.length == 0) cacheStore.entities.push('0x0');
  for (const entity of entities) {
    var hexId = uint8ArrayToHexString(entity.id);

    //CHECK INDEX
    if (entity.idx != cacheStore.entities.length) {
      console.log(
        `Entity.IDX ${entity.idx} does not match tail of list ${cacheStore.entities.length}`
      );
      continue;
    }

    cacheStore.entities.push(hexId);
    cacheStore.entityToIndex.set(hexId, entity.idx);
  }
  console.log('Stored entities');
}

// store values into the cache store
export async function storeValues(
  cacheStore: CacheStore,
  values: State[],
  decode: ReturnType<typeof createDecode>
) {
  for (const event of values) {
    const { packedIdx, data } = event;
    let componentIdx = unpackTuple(packedIdx)[0];
    const value = await decode(cacheStore.components[componentIdx], data);
    cacheStore.state.set(packedIdx, value);
  }
  console.log('Stored values');
}

export function removeValues(cacheStore: CacheStore, values: State[]) {
  for (const event of values) {
    const { packedIdx, data } = event;
    cacheStore.state.delete(packedIdx);
  }
  console.log('Removed values');
}
