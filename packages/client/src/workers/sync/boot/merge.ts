import { packTuple } from '@mud-classic/utils';
import { formatEntityID } from 'engine/utils';

import { StateCache, storeEvent } from '../state/cache';
import { StateEvent } from '../state/types';
import { resolveKey } from './emit';

// 'replace' covers the warm in-place delta and any full cache; a later cold plan adds
// 'overlay' for slices without changing callers.
export type Load = { kind: 'replace'; name: string; cache: StateCache };

export type MergeOptions = {
  // skip events whose component or entity has no idx yet, so nothing is appended ahead of
  // an in-flight delta that appends at the tail (plan F2)
  freezeIndex: boolean;
  emitted?: Set<number>;
};

export type MergeStats = {
  load: string;
  block: number;
  gap: number;
  log: number;
  deferred: number;
  removed: number;
};

// Mutates cache. Returns false when the event was deferred by freezeIndex.
export const applyEvent = (cache: StateCache, event: StateEvent, freezeIndex: boolean) => {
  const unknown =
    !cache.componentToIndex.has(event.component) ||
    !cache.entityToIndex.has(formatEntityID(event.entity));
  if (freezeIndex && unknown) return false;
  storeEvent(cache, event);
  return true;
};

const survives = (next: StateCache, canonical: StateCache, key: number) => {
  if (next === canonical) return next.state.has(key);
  const resolved = resolveKey(canonical, key);
  if (!resolved) return false;
  const component = next.componentToIndex.get(resolved.component);
  const entity = next.entityToIndex.get(resolved.entity);
  return component != null && entity != null && next.state.has(packTuple([component, entity]));
};

/**
 * Applies the load, then the gap, then the whole live log in arrival order, with no block
 * cut (plan F6). Events are absolute set/remove, so replaying overlaps is idempotent.
 *
 * Mutates load.cache and returns it as the new canonical. `canonical` is only read: it
 * owns the idx space of `opts.emitted`, and `removedKeys` are in that same space, so pass
 * the same `canonical` to `removalsFor`. On the warm path load.cache === canonical (the
 * delta ran in place and the tables only grew), so those keys stay valid.
 *
 * removedKeys = emitted keys with no value after the merge, including emitted keys
 * `canonical` cannot resolve (removalsFor counts those as unresolved).
 */
export const mergeLoad = (
  canonical: StateCache,
  load: Load,
  gapEvents: StateEvent[],
  liveLog: StateEvent[],
  opts: MergeOptions
) => {
  const next = load.cache;
  let deferred = 0;
  // storeEvent sets blockNumber from each event in arrival order, so a late verifier event
  // would move it backwards; keep the highest instead
  let blockNumber = next.blockNumber;
  for (const events of [gapEvents, liveLog]) {
    for (const event of events) {
      if (!applyEvent(next, event, opts.freezeIndex)) deferred++;
      blockNumber = Math.max(blockNumber, next.blockNumber);
    }
  }
  next.blockNumber = blockNumber;

  const removedKeys: number[] = [];
  for (const key of opts.emitted ?? []) if (!survives(next, canonical, key)) removedKeys.push(key);

  const stats: MergeStats = {
    load: load.name,
    block: next.lastKamigazeBlock,
    gap: gapEvents.length,
    log: liveLog.length,
    deferred,
    removed: removedKeys.length,
  };
  return { canonical: next, removedKeys, stats };
};
