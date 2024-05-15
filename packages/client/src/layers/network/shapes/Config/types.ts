import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { BigNumber, utils } from 'ethers';

import { Components } from 'layers/network';

// get an Config from its EntityIndex
export const getConfigFieldValue = (
  world: World,
  components: Components,
  field: string
): number => {
  const { BareValue } = components;

  const configEntityIndex = getEntityIndex(world, field);
  if (!configEntityIndex) {
    // console.error(`Config field not found for ${field}`);
    return 0;
  }

  return (getComponentValue(BareValue, configEntityIndex)?.value as number) * 1;
};

// get an Config from its EntityIndex
export const getConfigFieldValueArray = (
  world: World,
  components: Components,
  field: string
): number[] => {
  const { BareValue } = components;

  const configEntityIndex = getEntityIndex(world, field);
  if (!configEntityIndex) {
    // console.warn(`Config field not found for ${field}`);
    return [0];
  }

  const raw = getComponentValue(BareValue, configEntityIndex)?.value;
  if (!raw) return [];
  return unpackArray(BigNumber.from(raw));
};

// get an Config from its EntityIndex. Wei values are stored in bigint
export const getConfigFieldValueWei = (
  world: World,
  components: Components,
  field: string
): bigint => {
  const { BareValue } = components;

  const configEntityIndex = getEntityIndex(world, field);
  if (!configEntityIndex) {
    // console.warn(`Config field not found for ${field}`);
    return 0n;
  }
  const stringVal = (getComponentValue(BareValue, configEntityIndex)?.value as number) || 0;
  return BigInt(stringVal);
};

const getEntityIndex = (world: World, field: string): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(['string', 'string'], ['is.config', field]);
  return world.entityToIndex.get(id as EntityID);
};

// unpack a uint32[8] array from a config uint256
const unpackArray = (packed: BigNumber): number[] => {
  const result = [];
  for (let i = 0; i < 8; i++) {
    // mask to current
    const curr = packed.and(BigNumber.from(1).shl(32).sub(1));
    // push to array
    result.push(curr.toNumber());
    // updated packed
    packed = packed.shr(32);
  }
  return result.reverse();
};
