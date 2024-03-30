import { Has, HasValue, getComponentValue, runQuery } from '@mud-classic/recs';

import { Components } from 'layers/network';

// get an Config from its EntityIndex
export const getConfigFieldValue = (components: Components, field: string): number => {
  const { IsConfig, Name, Value } = components;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];
  return (getComponentValue(Value, configEntityIndex)?.value as number) * 1;
};

// get an Config from its EntityIndex. Wei values are stored in bigint
export const getConfigFieldValueWei = (components: Components, field: string): bigint => {
  const { IsConfig, Name, Wei } = components;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];
  const stringVal = (getComponentValue(Wei, configEntityIndex)?.value as string) || 0;
  return BigInt(stringVal);
};
