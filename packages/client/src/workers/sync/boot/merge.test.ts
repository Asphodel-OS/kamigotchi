import { packTuple } from '@mud-classic/utils';
import { toBeArray } from 'ethers';
import { describe, expect, it } from 'vitest';

import { NetworkEvents } from 'workers/types';
import {
  create,
  removeValues,
  StateCache,
  storeComponents,
  storeEntities,
  storeEvent,
  storeValues,
} from '../state/cache';
import { StateEvent } from '../state/types';
import { removalsFor } from './emit';
import { applyEvent, mergeLoad, MergeOptions } from './merge';
import { formatTrace } from './trace';

const C = '0xc1';
const C2 = '0xc2';
const E1 = '0x1';
const E2 = '0x2';
const E3 = '0x3';
const B = 100;

const ev = (entity: string, value: number | undefined, blockNumber: number, component = C) =>
  ({
    type: NetworkEvents.NetworkComponentUpdate,
    component,
    entity,
    value: value == null ? undefined : { value },
    blockNumber,
  }) as StateEvent;

const cacheOf = (...events: StateEvent[]) => {
  const cache = create();
  for (const event of events) storeEvent(cache, event);
  cache.lastKamigazeBlock = B;
  return cache;
};

// shaped like a kamigaze/IDB cache: primed '0x0' at idx 0, tables appended at the tail
const kamigazeCacheOf = (entityIds: string[], componentIds: string[]) => {
  const cache = create();
  storeComponents(
    cache,
    componentIds.map((id, i) => ({ idx: i + 1, id: toBeArray(BigInt(id)) }))
  );
  storeEntities(
    cache,
    entityIds.map((id, i) => ({ idx: i + 1, id: toBeArray(BigInt(id)) }))
  );
  cache.lastKamigazeBlock = B;
  return cache;
};

const keyOf = (cache: StateCache, entity: string, component = C) =>
  packTuple([cache.componentToIndex.get(component)!, cache.entityToIndex.get(entity)!]);

const valueOf = (cache: StateCache, entity: string, component = C) =>
  (cache.state.get(keyOf(cache, entity, component)) as { value: number } | undefined)?.value;

const merge = (
  cache: StateCache,
  gap: StateEvent[],
  log: StateEvent[],
  opts: MergeOptions = { freezeIndex: false }
) => mergeLoad(cache, { kind: 'replace', name: 'delta', cache }, gap, log, opts);

const stats = (gap: number, log: number, deferred = 0, removed = 0) => ({
  load: 'delta',
  block: B,
  gap,
  log,
  deferred,
  removed,
});

describe('mergeLoad', () => {
  it('1: the log wins over a gap value published before t0', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const result = merge(cache, [ev(E1, 2, 101)], [ev(E1, 3, 105)]);
    expect(valueOf(result.canonical, E1)).toBe(3);
    expect(result.stats).toEqual(stats(1, 1));
  });

  it('2: a gap value published after t0 is also in the log; the newest wins', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const result = merge(cache, [ev(E1, 3, 105)], [ev(E1, 2, 103), ev(E1, 3, 105)]);
    expect(valueOf(result.canonical, E1)).toBe(3);
    expect(result.stats).toEqual(stats(1, 2));
  });

  it('3: a live event after the fetch is applied once', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const result = merge(cache, [], [ev(E2, 7, 110)]);
    expect(valueOf(result.canonical, E2)).toBe(7);
    expect(result.canonical.state.size).toBe(2);
    expect(result.stats).toEqual(stats(0, 1));
  });

  it('4: indexer lag: the gap is inclusive of B', () => {
    const cache = cacheOf(ev(E1, 1, B), ev(E2, 1, B));
    const gap = [ev(E1, 2, B), ev(E2, 5, 400)];
    const result = merge(cache, gap, [ev(E3, 9, 500)]);
    expect(valueOf(result.canonical, E1)).toBe(2);
    expect(valueOf(result.canonical, E2)).toBe(5);
    expect(valueOf(result.canonical, E3)).toBe(9);
    expect(result.stats).toEqual(stats(2, 1));
  });

  it('5: an event in both gap and log is idempotent: one row, same value', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const dup = ev(E2, 4, 120);
    const result = merge(cache, [dup], [dup]);
    expect(valueOf(result.canonical, E2)).toBe(4);
    expect(result.canonical.state.size).toBe(2);
    expect(result.stats).toEqual(stats(1, 1));
  });

  it('6: a gap removal after a load set is absent and listed if emitted', () => {
    const cache = cacheOf(ev(E1, 1, B), ev(E2, 1, B));
    const k1 = keyOf(cache, E1);
    const k2 = keyOf(cache, E2);
    const result = merge(cache, [ev(E1, undefined, 101)], [], {
      freezeIndex: false,
      emitted: new Set([k1, k2]),
    });
    expect(result.canonical.state.has(k1)).toBe(false);
    expect(result.removedKeys).toEqual([k1]);
    expect(result.stats).toEqual(stats(1, 0, 0, 1));
  });

  it('7: a log set after a gap removal is present', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const k1 = keyOf(cache, E1);
    const result = merge(cache, [ev(E1, undefined, 101)], [ev(E1, 8, 102)], {
      freezeIndex: false,
      emitted: new Set([k1]),
    });
    expect(valueOf(result.canonical, E1)).toBe(8);
    expect(result.removedKeys).toEqual([]);
    expect(result.stats).toEqual(stats(1, 1));
  });

  it('8: an unknown entity is deferred under freezeIndex, then appended by the final merge', () => {
    const cache = kamigazeCacheOf([E1], [C]);
    const live = ev(E3, 5, 150);

    expect(applyEvent(cache, live, true)).toBe(false);
    expect(merge(cache, [], [live], { freezeIndex: true }).stats).toEqual(stats(0, 1, 1));
    expect(cache.entities).toEqual(['0x0', E1]);

    storeEntities(cache, [{ idx: 2, id: toBeArray(BigInt(E2)) }]);
    expect(cache.entities).toEqual(['0x0', E1, E2]);

    const result = merge(cache, [], [live]);
    expect(result.canonical.entities).toEqual(['0x0', E1, E2, E3]);
    expect(valueOf(result.canonical, E3)).toBe(5);
    expect(result.stats).toEqual(stats(0, 1));
  });

  it('9: a warm delta appending in place keeps idx alignment and old keys', () => {
    const cache = kamigazeCacheOf([E1], [C]);
    storeValues(cache, [{ packedIdx: packTuple([1, 1]), data: new Uint8Array() }], () => ({
      value: 1,
    }));
    const k1 = keyOf(cache, E1);

    const liveOnKnown = ev(E1, 6, 150);
    const liveOnNew = ev(E3, 9, 151, C2);
    expect(applyEvent(cache, liveOnKnown, true)).toBe(true);
    expect(applyEvent(cache, liveOnNew, true)).toBe(false);

    storeComponents(cache, [{ idx: 2, id: toBeArray(BigInt(C2)) }]);
    storeEntities(cache, [{ idx: 2, id: toBeArray(BigInt(E2)) }]);
    storeValues(cache, [{ packedIdx: packTuple([2, 2]), data: new Uint8Array() }], () => ({
      value: 2,
    }));

    expect(cache.components).toEqual(['0x0', C, C2]);
    expect(cache.entities).toEqual(['0x0', E1, E2]);

    const result = merge(cache, [], [liveOnKnown, liveOnNew], {
      freezeIndex: false,
      emitted: new Set([k1]),
    });
    expect(keyOf(result.canonical, E1)).toBe(k1);
    expect(valueOf(result.canonical, E1)).toBe(6);
    expect(valueOf(result.canonical, E2, C2)).toBe(2);
    expect(result.canonical.entities).toEqual(['0x0', E1, E2, E3]);
    expect(valueOf(result.canonical, E3, C2)).toBe(9);
    expect(result.removedKeys).toEqual([]);
    expect(result.stats).toEqual(stats(0, 2));
  });

  it('10: a replace with a fresh cache lists emitted keys that are now absent', () => {
    const canonical = cacheOf(ev(E1, 1, B), ev(E2, 1, B));
    const k1 = keyOf(canonical, E1);
    const k2 = keyOf(canonical, E2);
    const fresh = cacheOf(ev(E2, 2, B));
    expect(keyOf(fresh, E2)).toBe(k1);

    const result = mergeLoad(canonical, { kind: 'replace', name: 'full', cache: fresh }, [], [], {
      freezeIndex: false,
      emitted: new Set([k1, k2]),
    });
    expect(result.canonical).toBe(fresh);
    expect(result.removedKeys).toEqual([k1]);
    expect(result.stats).toEqual({ ...stats(0, 0, 0, 1), load: 'full' });
    expect(removalsFor(result.removedKeys, canonical).updates).toMatchObject([
      { component: C, entity: E1, value: undefined },
    ]);
  });

  it('10b: a fresh-cache replace lists emitted keys the old tables cannot resolve', () => {
    const canonical = cacheOf(ev(E1, 1, B));
    const orphan = packTuple([0, 99]);
    const fresh = cacheOf(ev(E1, 1, B));

    const result = mergeLoad(canonical, { kind: 'replace', name: 'full', cache: fresh }, [], [], {
      freezeIndex: false,
      emitted: new Set([keyOf(canonical, E1), orphan]),
    });
    expect(result.removedKeys).toEqual([orphan]);
    expect(removalsFor(result.removedKeys, canonical)).toEqual({ updates: [], unresolved: 1 });
  });

  // merge has no account concept: this pins that a SetAccount (X to Y) mid-boot cannot make
  // the merge drop or list X's already-emitted rows
  it("11: SetAccount X to Y: X's emitted rows survive and are not listed as removed", () => {
    const X = '0xa';
    const Y = '0xb';
    const cache = cacheOf(ev(X, 1, B), ev(Y, 1, B));
    const emittedForX = new Set([keyOf(cache, X)]);
    const result = merge(cache, [], [ev(Y, 2, 101)], { freezeIndex: false, emitted: emittedForX });
    expect(valueOf(result.canonical, X)).toBe(1);
    expect(result.removedKeys).toEqual([]);
    expect(result.stats).toEqual(stats(0, 1));
  });

  it('12: warm ghost: a key emitted at tier 2 and removed by the delta is listed', () => {
    const cache = kamigazeCacheOf([E1, E2], [C]);
    storeValues(
      cache,
      [
        { packedIdx: packTuple([1, 1]), data: new Uint8Array() },
        { packedIdx: packTuple([1, 2]), data: new Uint8Array() },
      ],
      () => ({ value: 1 })
    );
    const ghost = keyOf(cache, E2);
    const emitted = new Set([keyOf(cache, E1), ghost]);

    removeValues(cache, [{ packedIdx: ghost, data: new Uint8Array() }]);

    const result = merge(cache, [], [], { freezeIndex: false, emitted });
    expect(result.removedKeys).toEqual([ghost]);
    expect(result.stats).toEqual(stats(0, 0, 0, 1));
    const removals = removalsFor(result.removedKeys, cache);
    expect(removals.unresolved).toBe(0);
    expect(removals.updates).toMatchObject([{ component: C, entity: E2, value: undefined }]);
  });

  it('13: partial head block: later block-N log events are all applied', () => {
    const N = 200;
    const cache = cacheOf(ev(E1, 1, B));
    const result = merge(cache, [ev(E1, 1, N)], [ev(E2, 2, N), ev(E1, 3, N)]);
    expect(valueOf(result.canonical, E1)).toBe(3);
    expect(valueOf(result.canonical, E2)).toBe(2);
    expect(result.stats).toEqual(stats(1, 2));
  });

  it('14: a late verifier event below the gap head is applied', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const result = merge(cache, [ev(E1, 2, 300)], [ev(E1, 5, 310), ev(E2, 9, 250)]);
    expect(valueOf(result.canonical, E1)).toBe(5);
    expect(valueOf(result.canonical, E2)).toBe(9);
    expect(result.canonical.blockNumber).toBe(309);
    expect(result.stats).toEqual(stats(1, 2));
  });

  it('15: an in-flight gap value is stale until it arrives on the stream, then heals', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const inFlight = ev(E1, 7, 210);
    const result = merge(cache, [inFlight], [ev(E1, 4, 205)]);
    expect(valueOf(result.canonical, E1)).toBe(4);
    expect(result.stats).toEqual(stats(1, 1));

    applyEvent(result.canonical, inFlight, false);
    expect(valueOf(result.canonical, E1)).toBe(7);
  });

  it('16: an unresolvable removed key is counted, not thrown', () => {
    const cache = cacheOf(ev(E1, 1, B));
    const orphan = packTuple([0, 99]);
    const result = merge(cache, [], [], { freezeIndex: false, emitted: new Set([orphan]) });
    expect(result.removedKeys).toEqual([orphan]);
    expect(result.stats).toEqual(stats(0, 0, 0, 1));

    const removals = removalsFor(result.removedKeys, cache);
    expect(removals).toEqual({ updates: [], unresolved: 1 });
    expect(formatTrace({ ...result.stats, unresolved: removals.unresolved, ms: 12.4 })).toBe(
      '[tier] load=delta block=100 gap=0 log=0 deferred=0 removed=1 unresolved=1 ms=12'
    );
  });
});
