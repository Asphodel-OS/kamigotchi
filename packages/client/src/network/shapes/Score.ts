import {
  EntityID,
  EntityIndex,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Account, getAccount } from './Account';
import { getEntityByHash, hashArgs } from './utils';

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
  const { Value } = components;

  // populate the holder
  const index = getEntityIndex(world, holderID, epoch, type);
  const accountEntityIndex = world.entityToIndex.get(holderID) as EntityIndex;
  const account = getAccount(world, components, accountEntityIndex);

  return {
    account,
    score: index ? (getComponentValue(Value, index)?.value as number) : 0,
  };
};

// get a Score object from its EnityIndex
export const getScore = (world: World, components: Components, index: EntityIndex): Score => {
  const { HolderID, Value } = components;

  // populate the holder
  const accountID = formatEntityID(getComponentValue(HolderID, index)?.value ?? '');
  const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  const account = getAccount(world, components, accountEntityIndex);

  return {
    account,
    score: (getComponentValue(Value, index)?.value as number) * 1,
  };
};

export const getScoresByType = (world: World, components: Components, type: EntityID): Score[] => {
  const { TypeID } = components;

  // set filters
  const queryFragments = [HasValue(TypeID, { value: type })] as QueryFragment[];

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

/////////////////
// IDs

const getEntityIndex = (
  world: any,
  holderID: EntityID,
  epoch: number,
  field: string
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['is.score', holderID, epoch, field],
    ['string', 'uint256', 'uint32', 'string']
  );
};

const getType = (type: string, epoch: number): EntityID => {
  return hashArgs(['score.type', type, epoch], ['string', 'string', 'uint256'], true);
};
