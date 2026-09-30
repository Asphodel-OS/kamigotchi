import { formatComponentID } from 'engine/utils';
import { id } from 'ethers';
import { describe, expect, it, vi } from 'vitest';

import { NetworkEvents } from 'workers/types';
import { create, storeEvent } from '../state/cache';
import { StateEvent } from '../state/types';
import fixture from './__fixtures__/slice_walk.json';
import { runCensus } from './census';

const names = Object.fromEntries(
  Object.entries(fixture.components).map(([name, contractId]) => [id(contractId), name])
);

describe('runCensus', () => {
  it('sizes the buckets and leaves only unwalked entities in the residual', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
    const cache = create();
    for (const [entity, name, value] of fixture.rows) {
      storeEvent(cache, {
        type: NetworkEvents.NetworkComponentUpdate,
        component: formatComponentID(id(fixture.components[name as 'Value'])),
        entity,
        value: { value },
        blockNumber: 1,
      } as unknown as StateEvent);
    }

    const result = runCensus(cache, {
      accountId: fixture.account,
      configIds: fixture.configIds,
      names,
    });

    expect(result.buckets.registry!.entities).toBe(fixture.expected.registry.length);
    expect(result.buckets.account!.entities).toBe(fixture.expected.account.length);
    expect(result.buckets.all!.rows).toBe(fixture.rows.length);
    expect(result.linkedRegistryTypes).toEqual([]);
    expect(result.closureDepths).toEqual({ 1: 5, 2: 3, 3: 1 });
    // 0xb0b's and the untyped IndexAccount 0xacc0's slices are walked as accounts; 0xdea0
    // carries no account marker, so its inventory stays residual
    expect(result.untypedAccounts).toBe(1);
    expect(result.residual).toEqual([
      { signature: 'EntityType+IdSource+IdTarget', count: 1, rows: 3, sample: '0x900' },
      { signature: 'EntityType+IDAnchor+IdSource', count: 1, rows: 3, sample: '0x901' },
      { signature: 'Value', count: 1, rows: 1, sample: fixture.expected.unwalked[2] },
      { signature: 'EntityType+IDOwnsKami', count: 1, rows: 2, sample: '0x810' },
      { signature: 'Name', count: 1, rows: 1, sample: '0xdea0' },
      { signature: 'EntityType+IDOwnsInventory', count: 1, rows: 2, sample: '0xdea1' },
    ]);
    expect(result.untypedTargets).toEqual([{ signature: 'Name', count: 1, sample: '0xdea0' }]);
    expect(result.residualLinks).toEqual([
      {
        link: 'IDAnchor -> unknown-entity',
        count: 1,
        sampleEntity: '0x901',
        sampleTarget: '0xe1d',
      },
      {
        link: 'IDOwnsKami -> unknown-entity',
        count: 1,
        sampleEntity: '0x810',
        sampleTarget: '0x9ac4a',
      },
      {
        link: 'IDOwnsInventory -> untyped-entity',
        count: 1,
        sampleEntity: '0xdea1',
        sampleTarget: '0xdea0',
      },
    ]);
  });
});
