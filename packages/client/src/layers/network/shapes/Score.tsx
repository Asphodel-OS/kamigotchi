import {
  EntityID,
  EntityIndex,
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
  score: number;
}

export interface ScoresFilter {
  epoch: number;
  type: string;
}

export const getScoreFromHash = (
  world: World,
  components: Components,
  holderID: EntityID,
  epoch: number,
  type: string
): Score => {
  const { Balance } = components;

  // populate the holder
  const index = getEntityIndex(world, holderID, epoch, type);
  const accountEntityIndex = world.entityToIndex.get(holderID) as EntityIndex;
  const account = getAccount(world, components, accountEntityIndex);

  return {
    account,
    score: index ? (getComponentValue(Balance, index)?.value as number) : 0,
  };
};

// get a Score object from its EnityIndex
export const getScore = (world: World, components: Components, index: EntityIndex): Score => {
  const { BareHolderID, Balance } = components;

  // populate the holder
  const accountID = getComponentValue(BareHolderID, index)?.value as EntityID;
  const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  const account = getAccount(world, components, accountEntityIndex);

  return {
    account,
    score: (getComponentValue(Balance, index)?.value as number) * 1,
  };
};

export const getScoresByType = (world: World, components: Components, type: EntityID): Score[] => {
  const { ScoreTypeID } = components;

  // set filters
  const queryFragments = [HasValue(ScoreTypeID, { value: type })] as QueryFragment[];

  // retrieve the relevant entities and their shapes
  const scoreEntityIndices = Array.from(runQuery(queryFragments));
  const scores = scoreEntityIndices.map((index) => getScore(world, components, index));

  return scores.sort((a, b) => b.score - a.score);
};

export const getScoresByFilter = (
  world: World,
  components: Components,
  filter: ScoresFilter
): Score[] => {
  const typeID = getType(filter.type, filter.epoch);
  return getScoresByType(world, components, typeID);
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

const getType = (type: string, epoch: number): EntityID => {
  const id = utils.solidityKeccak256(['string', 'string', 'uint256'], ['score.type', type, epoch]);
  return id as EntityID;
};
