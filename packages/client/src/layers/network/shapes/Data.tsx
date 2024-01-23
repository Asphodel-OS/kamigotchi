import {
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';

// get a DataEntity for an account 
export const getData = (
  layers: Layers,
  id: EntityID,
  type: string,
  index?: number,
): number => {
  const {
    network: {
      components: {
        HolderID,
        IsData,
        Index,
        Type,
        Value,
      },
    }
  } = layers;

  let configEntityIndex;
  if (index && index > 0) {
    configEntityIndex = Array.from(
      runQuery([
        Has(IsData),
        HasValue(HolderID, { value: id }),
        HasValue(Type, { value: type }),
        HasValue(Index, { value: index })
      ])
    )[0];
  } else {
    configEntityIndex = Array.from(
      runQuery([
        Has(IsData),
        HasValue(HolderID, { value: id }),
        HasValue(Type, { value: type }),
      ])
    )[0];
  }
  return (getComponentValue(Value, configEntityIndex)?.value != undefined)
    ? getComponentValue(Value, configEntityIndex)?.value as number * 1
    : 0;
}