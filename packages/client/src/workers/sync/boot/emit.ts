import { unpackTuple } from '@mud-classic/utils';
import { ComponentValue, EntityID } from 'engine/recs';

import { NetworkComponentUpdate, NetworkEvents } from 'workers/types';
import { StateCache } from '../state/cache';

export type Tables = Pick<StateCache, 'components' | 'entities'>;
export type ResolvedKey = { component: string; entity: EntityID };

// Unlike getEntries, a key whose idx is missing from the tables is reported, not thrown:
// on the tiered path a throw here would land in the INITIALIZE retry loop.
export const resolveKey = (tables: Tables, key: number): ResolvedKey | undefined => {
  const [componentIdx, entityIdx] = unpackTuple(key);
  const component = tables.components[componentIdx];
  const entity = tables.entities[entityIdx];
  if (component == null || entity == null) return undefined;
  return { component, entity: entity as EntityID };
};

export const toUpdate = (
  { component, entity }: ResolvedKey,
  value: ComponentValue | undefined,
  blockNumber: number
): NetworkComponentUpdate =>
  ({
    type: NetworkEvents.NetworkComponentUpdate,
    component,
    entity,
    value,
    lastEventInTx: false,
    txHash: 'cache',
    blockNumber,
  }) as NetworkComponentUpdate;

export const removalsFor = (keys: Iterable<number>, tables: Tables, blockNumber = 0) => {
  const updates: NetworkComponentUpdate[] = [];
  let unresolved = 0;
  for (const key of keys) {
    const resolved = resolveKey(tables, key);
    if (resolved) updates.push(toUpdate(resolved, undefined, blockNumber));
    else unresolved++;
  }
  return { updates, unresolved };
};
