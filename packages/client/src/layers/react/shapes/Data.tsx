import {
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account } from 'src/layers/react/shapes/Account';
import { Kami } from 'src/layers/react/shapes/Kami';

// get a DataEntity for an account 
export const getAccountData = (
  layers: Layers,
  account: Account,
  type: string,
): number => {
  const {
    network: {
      components: {
        AccountID,
        IsData,
        Type,
        Value,
      },
    }
  } = layers;

  const configEntityIndex = Array.from(
    runQuery([
      Has(IsData),
      HasValue(AccountID, { value: account.id }),
      HasValue(Type, { value: type }),
    ])
  )[0];
  return getComponentValue(Value, configEntityIndex)?.value != undefined
    ? getComponentValue(Value, configEntityIndex)?.value as number * 1
    : 0;
}

export const getKamiData = (
  layers: Layers,
  kami: Kami,
  type: string,
): number => {
  const {
    network: {
      components: {
        AccountID,
        IsData,
        Type,
        Value,
      },
    }
  } = layers;

  const configEntityIndex = Array.from(
    runQuery([
      Has(IsData),
      HasValue(AccountID, { value: account.id }),
      HasValue(Type, { value: type }),
    ])
  )[0];
  return getComponentValue(Value, configEntityIndex)?.value != undefined
    ? getComponentValue(Value, configEntityIndex)?.value as number * 1
    : 0;
}