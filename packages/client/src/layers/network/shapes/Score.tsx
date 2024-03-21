import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { utils } from 'ethers';

import { Components } from 'layers/network';
import { Account, getAccount } from './Account';

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

export const getScoreFromHash = (
  network: NetworkLayer,
  holderID: EntityID,
  epoch: number,
  type: string
): Score => {
  const {
    world,
    components: { Balance },
  } = network;

  // populate the holder
  const index = getEntityIndex(world, holderID, epoch, type);
  const accountEntityIndex = world.entityToIndex.get(holderID) as EntityIndex;
  const account = getAccount(network, accountEntityIndex);

  return {
    account,
    score: index ? (getComponentValue(Balance, index)?.value as number) : 0,
    epoch: epoch,
    type: type,
  };
};

// get a Score object from its EnityIndex
export const getScore = (world: World, components: Components, index: EntityIndex): Score => {
  const { Balance, Epoch, HolderID, Type } = components;

  // populate the holder
  const accountID = getComponentValue(HolderID, index)?.value as EntityID;
  const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  const account = getAccount(world, components, accountEntityIndex);

  return {
    account,
    score: (getComponentValue(Balance, index)?.value as number) * 1,
    epoch: (getComponentValue(Epoch, index)?.value as number) * 1,
    type: getComponentValue(Type, index)?.value as string,
  };
};

export const getScores = (world: World, components: Components, filter: ScoresFilter): Score[] => {
  const { IsScore, Epoch, Type } = components;

  // set filters
  const queryFragments = [Has(IsScore)] as QueryFragment[];
  if (filter.epoch) queryFragments.push(HasValue(Epoch, { value: filter.epoch }));
  if (filter.type) queryFragments.push(HasValue(Type, { value: filter.type }));

  // retrieve the relevant entities and their shapes
  const scoreEntityIndices = Array.from(runQuery(queryFragments));
  const scores = scoreEntityIndices.map((index) => getScore(world, components, index));

  return scores.sort((a, b) => b.score - a.score);
};

const getEntityIndex = (
  world: any,
  holderID: EntityID,
  index: number,
  field: string
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'uint32', 'string'],
    [holderID, index, index, field]
  );
  return world.entityToIndex.get(id as EntityID);
};
