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
import { getValue } from './utils/component';

// standardized Object shape of a Score Entity
export interface Score {
  account: Account;
  score: number;
}

export interface ScoresFilter {
  epoch: number;
  index: number;
  type: string;
}

export const getScoreFromHash = (
  world: World,
  comps: Components,
  holderID: EntityID,
  epoch: number,
  index: number,
  type: string
): Score => {
  // populate the holder's
  const entity = getEntityIndex(world, holderID, epoch, index, type);
  const accountEntityIndex = world.entityToIndex.get(holderID) as EntityIndex;
  const account = getAccount(world, comps, accountEntityIndex);

  return {
    account,
    score: entity ? getValue(comps, entity) : 0,
  };
};

// get a Score object from its EnityIndex
export const getScore = (world: World, comps: Components, index: EntityIndex): Score => {
  const { HolderID, Value } = comps;

  // populate the holder
  const accountID = formatEntityID(getComponentValue(HolderID, index)?.value ?? '');
  const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  const account = getAccount(world, comps, accountEntityIndex);

  return {
    account,
    score: (getComponentValue(Value, index)?.value as number) * 1,
  };
};

export const getScoresByType = (world: World, comps: Components, type: EntityID): Score[] => {
  const { TypeID } = comps;

  // set filters
  const queryFragments = [HasValue(TypeID, { value: type })] as QueryFragment[];

  // retrieve the relevant entities and their shapes
  const scoreEntities = Array.from(runQuery(queryFragments));
  const scores = scoreEntities.map((index) => getScore(world, comps, index));

  return scores.sort((a, b) => b.score - a.score);
};

export const getScoresByFilter = (
  world: World,
  comps: Components,
  filter: ScoresFilter
): Score[] => {
  const typeID = getType(filter.epoch, filter.index, filter.type);
  return getScoresByType(world, comps, typeID);
};

/////////////////
// IDs

const getEntityIndex = (
  world: any,
  holderID: EntityID,
  epoch: number,
  index: number,
  field: string
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['is.score', holderID, epoch, index, field],
    ['string', 'uint256', 'uint256', 'uint32', 'string']
  );
};

const getType = (epoch: number, index: number, type: string): EntityID => {
  return hashArgs(['score.type', epoch, index, type], ['uint256', 'uint32', 'string'], true);
};
