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

export const getAllGoals = (world: World, components: Components): Goal[] => {
  const { EntityType } = components;

  const queryFragments = [HasValue(EntityType, { value: 'GOAL' })];
  const raw = Array.from(runQuery(queryFragments));

  return raw.map((index): Goal => getGoal(world, components, index));
};

export const getGoalByIndex = (world: World, components: Components, index: number): Goal => {
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

  return getGoal(world, components, entity);
};

export const getContributions = (
  world: World,
  components: Components,
  goalID: EntityID
): Contribution[] => {
  return getScoresByType(world, components, goalID);
};

export const getContributionByHash = (
  world: World,
  components: Components,
  goal: Goal,
  account: Account
): Contribution => {
  const entity = getContributionEntityIndex(world, goal.id, account.id);

  if (!entity) return { account: account, claimed: false, score: 0 };

  return getContribution(components, entity, account);
};
