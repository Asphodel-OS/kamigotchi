import { packTuple } from '@mud-classic/utils';
import { formatComponentID } from 'engine/utils';
import { id } from 'ethers';
import { describe, expect, it } from 'vitest';

import { NetworkEvents } from 'workers/types';
import { create, StateCache, storeEvent } from '../state/cache';
import { StateEvent } from '../state/types';
import fixture from './__fixtures__/slice_walk.json';
import { entriesFor, WALK_IDS, walkAccount, walkRegistry } from './walk';

const componentIds = Object.fromEntries(
  Object.entries(fixture.components).map(([name, contractId]) => [
    name,
    formatComponentID(id(contractId)),
  ])
);

const world = () => {
  const cache = create();
  for (const [entity, name, value] of fixture.rows) {
    storeEvent(cache, {
      type: NetworkEvents.NetworkComponentUpdate,
      component: componentIds[name as string]!,
      entity,
      value: { value },
      blockNumber: 1,
    } as unknown as StateEvent);
  }
  return cache;
};

const idsOf = (cache: StateCache, set: Set<number>) =>
  [...set].map((i) => cache.entities[i]).sort();

describe('walk', () => {
  it('uses the on-chain component ids', () => {
    expect(WALK_IDS.links).toContain(
      '0xf9b94d2a933222e58f90359e8ec33041c5f08d7bc4304958d1c52c21991da575'
    );
    expect(WALK_IDS.links).toHaveLength(13);
  });

  it('walks the registry', () => {
    const cache = world();
    expect(idsOf(cache, walkRegistry(cache, WALK_IDS, fixture.configIds))).toEqual(
      [...fixture.expected.registry].sort()
    );
  });

  it('walks the account', () => {
    const cache = world();
    expect(idsOf(cache, walkAccount(cache, WALK_IDS, fixture.account))).toEqual(
      [...fixture.expected.account].sort()
    );
  });

  it('leaves other players, friendships, temp bonuses and LibData counters unwalked', () => {
    const cache = world();
    const walked = new Set([
      ...walkRegistry(cache, WALK_IDS, fixture.configIds),
      ...walkAccount(cache, WALK_IDS, fixture.account),
    ]);
    const rest = cache.entities.filter((_, i) => !walked.has(i)).sort();
    expect(rest).toEqual([...fixture.expected.unwalked].sort());
    expect(idsOf(cache, walkAccount(cache, WALK_IDS, '0xb0b'))).toEqual(['0x800', '0xb0b']);
  });

  it('emits only the walked rows and skips keys it cannot resolve', () => {
    const cache = world();
    cache.state.set(packTuple([0, 999]), { value: 'orphan' });
    const account = walkAccount(cache, WALK_IDS, fixture.account);

    const entries = [...entriesFor(cache, account)];
    expect(new Set(entries.map((e) => e.entity))).toEqual(new Set(fixture.expected.account));
    expect([...entriesFor(cache, 'all')]).toHaveLength(fixture.rows.length);
  });
});
