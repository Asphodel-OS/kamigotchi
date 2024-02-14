import { EntityID, Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';

import { NetworkLayer } from 'layers/network/types';

// get a DataEntity for an account
export const getData = (
  network: NetworkLayer,
  id: EntityID,
  type: string,
  index?: number
): number => {
  const {
    components: { HolderID, IsData, Index, Type, Value },
  } = network;

  let configEntityIndex;
  if (index && index > 0) {
    configEntityIndex = Array.from(
      runQuery([
        Has(IsData),
        HasValue(HolderID, { value: id }),
        HasValue(Type, { value: type }),
        HasValue(Index, { value: index }),
      ])
    )[0];
  } else {
    configEntityIndex = Array.from(
      runQuery([Has(IsData), HasValue(HolderID, { value: id }), HasValue(Type, { value: type })])
    )[0];
  }
  return getComponentValue(Value, configEntityIndex)?.value != undefined
    ? (getComponentValue(Value, configEntityIndex)?.value as number) * 1
    : 0;
};
