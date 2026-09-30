import { packTuple } from '@mud-classic/utils';
import { formatComponentID } from 'engine/utils';
import { id, solidityPackedKeccak256 } from 'ethers';
import { describe, expect, it } from 'vitest';

import { NetworkEvents } from 'workers/types';
import { create, StateCache, storeEvent } from '../state/cache';
import { StateEvent } from '../state/types';
import fixture from './__fixtures__/slice_walk.json';
import {
  accountBuckets,
  configEntityId,
  entriesFor,
  listingPrices,
  registryBuckets,
  scanCache,
  tradeOrders,
  WALK_IDS,
  walkAccount,
  walkRegistry,
} from './walk';

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
    expect(WALK_IDS.SystemsRegistry).toBe(
      '0x017c816a964927a00e050edd780dcf113ca2756dfa9e9fda94a05c140d9317b0'
    );
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

  it('leaves other players, friendships, unrelated temp bonuses and LibData counters unwalked', () => {
    const cache = world();
    const walked = new Set([
      ...walkRegistry(cache, WALK_IDS, fixture.configIds),
      ...walkAccount(cache, WALK_IDS, fixture.account),
    ]);
    const rest = cache.entities.filter((_, i) => !walked.has(i)).sort();
    expect(rest).toEqual([...fixture.expected.unwalked].sort());
    expect(idsOf(cache, walkAccount(cache, WALK_IDS, '0xb0b'))).toEqual(
      [...fixture.expected.otherAccount].sort()
    );
  });

  it('puts trade orders in the owning account, not in R2', () => {
    const cache = world();
    const scan = scanCache(cache, WALK_IDS);
    const orders = tradeOrders('0xa00').map((order) => cache.entityToIndex.get(order)!);
    const { R2 } = registryBuckets(scan, fixture.configIds);
    const { D } = accountBuckets(scan, fixture.account);
    for (const order of orders) {
      expect(R2.has(order)).toBe(false);
      expect(D.has(order)).toBe(true);
    }
    expect(idsOf(cache, R2)).toEqual(['0x501', '0x502']);
  });

  it("walks the player's skill-anchored and kami temp bonuses into B", () => {
    const cache = world();
    const { B } = accountBuckets(scanCache(cache, WALK_IDS), fixture.account);
    expect(idsOf(cache, B)).toEqual(['0x7b1', '0x7b2']);
  });

  it('classifies address registries, global singletons and listing prices as registry', () => {
    const cache = world();
    const { R0, R1, R3 } = registryBuckets(scanCache(cache, WALK_IDS), []);
    const has = (set: Set<number>, entityId: string) => set.has(cache.entityToIndex.get(entityId)!);
    expect(has(R0, '0xc0de')).toBe(true);
    const named = (name: string) => '0x' + BigInt(id(name)).toString(16);
    expect(has(R3, named('droptable.sacrifice.normal'))).toBe(true);
    expect(has(R3, named('newbie.vendor'))).toBe(true);
    for (const price of listingPrices('0x610')) expect(has(R1, price)).toBe(true);
  });

  it('derives config ids the way the contracts and deploy tooling do', () => {
    const packed = solidityPackedKeccak256(['string'], ['is.configKAMI_MARKET_VAULT']);
    expect(configEntityId('KAMI_MARKET_VAULT')).toBe('0x' + BigInt(packed).toString(16));
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
