import { Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';

import { NetworkLayer } from 'layers/network/types';

// get an Config from its EntityIndex
export const getConfigFieldValue = (
  network: NetworkLayer,
  field: string
): number => {
  const {
    components: { IsConfig, Name, Value },
  } = network;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];
  return (getComponentValue(Value, configEntityIndex)?.value as number) * 1;
};

// get an Config from its EntityIndex. Wei values are stored in bigint
export const getConfigFieldValueWei = (
  network: NetworkLayer,
  field: string
): bigint => {
  const {
    components: { IsConfig, Name, Wei },
  } = network;

  const configEntityIndex = Array.from(
    runQuery([Has(IsConfig), HasValue(Name, { value: field })])
  )[0];
  const stringVal =
    (getComponentValue(Wei, configEntityIndex)?.value as string) || 0;
  return BigInt(stringVal);
};
