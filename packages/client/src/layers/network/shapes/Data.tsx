import { EntityID, Has, HasValue, World, getComponentValue, runQuery } from '@mud-classic/recs';

import { Components } from 'layers/network';

// get a DataEntity for an account
export const getData = (
  world: World,
  components: Components,
  id: EntityID,
  type: string,
  index?: number
): number => {
  const { HolderID, IsData, Index, Type, Value } = components;

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
