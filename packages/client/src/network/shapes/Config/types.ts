import { EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { numberToHex } from 'viem';
import { getEntityByHash, unpackArray32 } from '../utils';

// get an Config from its EntityIndex
export const getConfigFieldValue = (
  world: World,
  components: Components,
  field: string
): number => {
  const { Value } = components;
  const entity = query(world, field);
  if (!entity) return 0;

  return (getComponentValue(Value, entity)?.value as number) * 1;
};

export const getConfigFieldValueAddress = (
  world: World,
  components: Components,
  field: string
): string => {
  const { Value } = components;
  const entity = query(world, field);
  if (!entity) return '0x000000000000000000000000000000000000dEaD';

  const raw = getComponentValue(Value, entity)?.value;
  if (!raw) return '0x000000000000000000000000000000000000dEaD';
  return numberToHex(raw);
};

// get an Config from its EntityIndex
export const getConfigFieldValueArray = (
  world: World,
  components: Components,
  field: string
): number[] => {
  const { Value } = components;
  const entity = query(world, field);
  if (!entity) return [0];

  const raw = getComponentValue(Value, entity)?.value;
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
  const entity = query(world, field);
  if (!entity) return 0n;

  const stringVal = (getComponentValue(Value, entity)?.value as number) || 0;
  return BigInt(stringVal);
};

const query = (world: World, field: string): EntityIndex | undefined => {
  return getEntityByHash(world, ['is.config', field], ['string', 'string']);
};
