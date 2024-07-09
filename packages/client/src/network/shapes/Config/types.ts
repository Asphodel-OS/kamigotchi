import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { utils } from 'ethers';

import { Components } from 'network/';
import { unpackArray32 } from '../utils/data';

// get an Config from its EntityIndex
export const getConfigFieldValue = (
  world: World,
  components: Components,
  field: string
): number => {
  const { Value } = components;

  const configEntityIndex = getEntityIndex(world, field);
  if (!configEntityIndex) {
    // console.error(`Config field not found for ${field}`);
    return 0;
  }

  return (getComponentValue(Value, configEntityIndex)?.value as number) * 1;
};

// get an Config from its EntityIndex
export const getConfigFieldValueArray = (
  world: World,
  components: Components,
  field: string
): number[] => {
  const { Value } = components;

  const configEntityIndex = getEntityIndex(world, field);
  if (!configEntityIndex) {
    // console.warn(`Config field not found for ${field}`);
    return [0];
  }

  const raw = getComponentValue(Value, configEntityIndex)?.value;
  if (!raw) return [];
  return unpackArray32(raw);
};

// get an Config from its EntityIndex. Wei values are stored in bigint
export const getConfigFieldValueWei = (
  world: World,
  components: Components,
  field: string
): bigint => {
  const { Value } = components;

  const configEntityIndex = getEntityIndex(world, field);
  if (!configEntityIndex) {
    // console.warn(`Config field not found for ${field}`);
    return 0n;
  }
  const stringVal = (getComponentValue(Value, configEntityIndex)?.value as number) || 0;
  return BigInt(stringVal);
};

const getEntityIndex = (world: World, field: string): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(['string', 'string'], ['is.config', field]);
  return world.entityToIndex.get(id as EntityID);
};
