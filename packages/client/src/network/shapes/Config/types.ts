import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { BigNumber, utils } from 'ethers';

import { Components } from 'network/';
import { unpackArray32 } from '../utils/data';

// get an Config from its EntityIndex
export const getConfigFieldValue = (
  world: World,
  components: Components,
  field: string
): number => {
  const { Value } = components;
  const entityIndex = getEntityIndex(world, field);
  if (!entityIndex) return 0;

  return (getComponentValue(Value, entityIndex)?.value as number) * 1;
};

// get an Config from its EntityIndex
export const getConfigFieldValueArray = (
  world: World,
  components: Components,
  field: string
): number[] => {
  const { Value } = components;
  const entityIndex = getEntityIndex(world, field);
  if (!entityIndex) return [0];

  const raw = getComponentValue(Value, entityIndex)?.value;
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
  const entityIndex = getEntityIndex(world, field);
  if (!entityIndex) return 0n;

  const stringVal = (getComponentValue(Value, entityIndex)?.value as number) || 0;
  return BigInt(stringVal);
};

const getEntityIndex = (world: World, field: string): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(['string', 'string'], ['is.config', field]);
  const formattedID = BigNumber.from(id).toHexString() as EntityID;
  return world.entityToIndex.get(formattedID);
};
