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
    // 0xb0b and 0x800 belong to another ACCOUNT, so the all-accounts walk covers them
    expect(result.residual).toEqual([
      { signature: 'EntityType+IdSource+IdTarget', count: 1, rows: 3, sample: '0x900' },
      { signature: 'EntityType+IDAnchor+IdSource', count: 1, rows: 3, sample: '0x901' },
      { signature: 'Value', count: 1, rows: 1, sample: fixture.expected.unwalked[4] },
    ]);
  });
});
