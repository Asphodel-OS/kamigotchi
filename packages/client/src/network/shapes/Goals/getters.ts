import { EntityID, HasValue, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { getScoresByType } from '../Score';
import {
  Contribution,
  getContribution,
  getContributionEntityIndex,
  getGoal,
  getGoalEntityIndex,
  Goal,
} from './types';

export const getAllGoals = (world: World, comps: Components): Goal[] => {
  const { EntityType } = comps;

  const queryFragments = [HasValue(EntityType, { value: 'GOAL' })];
  const raw = Array.from(runQuery(queryFragments));

  return raw.map((index): Goal => getGoal(world, comps, index));
};

export const getGoalByIndex = (world: World, comps: Components, index: number): Goal => {
  const entity = getGoalEntityIndex(world, index);
  if (!entity)
    return {
      id: '1' as EntityID,
      index: index,
      name: 'Goal not found',
      description: '',
      room: 0,
      currBalance: 0,
      objective: { id: '1' as EntityID, target: { type: '' }, logic: '' },
      requirements: [],
      tiers: [],
      complete: false,
    };

  return getGoal(world, comps, entity);
};

export const getContributions = (comps: Components, goalID: EntityID): Contribution[] => {
  return getScoresByType(comps, goalID);
};

export const getContributionByHash = (
  world: World,
  comps: Components,
  goal: Goal,
  account: Account
): Contribution => {
  const entity = getContributionEntityIndex(world, goal.id, account.id);
  if (!entity) return { holderID: account.id, claimed: false, value: 0 };
  return getContribution(comps, entity, account);
};
