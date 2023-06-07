import {
  EntityID,
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account, getAccount } from './Account';

// standardized Object shape of a Score Entity
export interface Score {
  account: Account;
  epoch: number;
  type: string;
  score: number;
}

// get a Score object from its EnityIndex
export const getScore = (layers: Layers, index: EntityIndex): Score => {
  const {
    network: {
      components: {
        Balance,
        Epoch,
        HolderID,
        Type,
      },
      world,
    },
  } = layers;

  // populate the holder
  const accountID = getComponentValue(HolderID, index)?.value as EntityID;
  const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  const account = getAccount(layers, accountEntityIndex);

  return {
    account,
    score: getComponentValue(Balance, index)?.value as number * 1,
    epoch: getComponentValue(Epoch, index)?.value as number * 1,
    type: getComponentValue(Type, index)?.value as string,
  };
}