import { EntityIndex, World, getComponentValue } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { ethers } from 'ethers';

import { Components } from 'network/components';
import { getConfigFieldValue } from '../Config/types';
import { queryByIndex as queryKamiByIndex } from '../Kami/queries';

const vendorHash = formatEntityID(ethers.id('newbie.vendor'));

const getVendorEntity = (world: World): EntityIndex | undefined =>
  world.entityToIndex.get(vendorHash);

/// returns 3 kami indices from the pool (current cycle)
export const getDisplayedKamiIndices = (world: World, components: Components): number[] => {
  const vendorEntity = getVendorEntity(world);
  if (vendorEntity === undefined) return [];

  const pool = getComponentValue(components.Values, vendorEntity)?.value ?? [];
  if (pool.length === 0) return [];

  const cycleStart = getComponentValue(components.StartTime, vendorEntity)?.value ?? 0;
  const cycleDuration = getConfigFieldValue(world, components, 'NEWBIE_VENDOR_CYCLE');
  if (!cycleDuration) return [];

  const now = Math.floor(Date.now() / 1000);
  const cycleNumber = Math.floor((now - cycleStart) / cycleDuration);
  const offset = (cycleNumber * 3) % pool.length;

  const displaySize = Math.min(pool.length, 3);
  const indices: number[] = [];
  for (let i = 0; i < displaySize; i++) {
    indices.push(pool[(offset + i) % pool.length]);
  }
  return indices;
};

/// returns the entityIndex of the kami
export const getDisplayedKamis = (world: World, components: Components): EntityIndex[] => {
  return getDisplayedKamiIndices(world, components)
    .map((index) => queryKamiByIndex(world, components, index))
    .filter((e): e is EntityIndex => e !== undefined);
};
