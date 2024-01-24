import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Account, getAccount } from './Account';
import { NetworkLayer } from 'layers/network/types';


// standardized Object shape of a Score Entity
export interface Score {
  account: Account;
  epoch: number;
  type: string;
  score: number;
}

export interface ScoresFilter {
  epoch?: number;
  type?: '' | 'FEED' | 'COLLECT' | 'LIQUIDATE';
}

// get a Score object from its EnityIndex
export const getScore = (network: NetworkLayer, index: EntityIndex): Score => {
  const {
    world,
    components: {
      Balance,
      Epoch,
      HolderID,
      Type,
    },
  } = network;

  // populate the holder
  const accountID = getComponentValue(HolderID, index)?.value as EntityID;
  const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  const account = getAccount(network, accountEntityIndex);

  return {
    account,
    score: getComponentValue(Balance, index)?.value as number * 1,
    epoch: getComponentValue(Epoch, index)?.value as number * 1,
    type: getComponentValue(Type, index)?.value as string,
  };
}

export const getScores = (network: NetworkLayer, filter: ScoresFilter): Score[] => {
  const { IsScore, Epoch, Type } = network.components;

  // set filters
  const queryFragments = [Has(IsScore)] as QueryFragment[];
  if (filter.epoch) queryFragments.push(HasValue(Epoch, { value: filter.epoch }));
  if (filter.type) queryFragments.push(HasValue(Type, { value: filter.type }));

  // retrieve the relevant entities and their shapes
  const scoreEntityIndices = Array.from(runQuery(queryFragments));
  const scores = scoreEntityIndices.map((index) => getScore(network, index));

  return scores.sort((a, b) => b.score - a.score);
}