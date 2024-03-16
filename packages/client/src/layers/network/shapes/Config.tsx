import { Has, HasValue, getComponentValue, runQuery } from '@mud-classic/recs';
import { BigNumber } from 'ethers';

import { Components } from 'layers/network';

// get an Config from its EntityIndex
export const getConfigFieldValue = (components: Components, field: string): number => {
  const { IsConfig, Name, BareValue } = components;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];

  return (getComponentValue(BareValue, configEntityIndex)?.value as number) * 1;
};

// get an Config from its EntityIndex
export const getConfigFieldValueArray = (components: Components, field: string): number[] => {
  const { IsConfig, Name, BareValue } = components;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];

  const raw = getComponentValue(BareValue, configEntityIndex)?.value;
  if (!raw) return [];
  return unpackArray(BigNumber.from(raw));
};

// get an Config from its EntityIndex. Wei values are stored in bigint
export const getConfigFieldValueWei = (components: Components, field: string): bigint => {
  const { IsConfig, Name, BareValue } = components;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];
  const stringVal = (getComponentValue(BareValue, configEntityIndex)?.value as number) || 0;
  return BigInt(stringVal);
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
