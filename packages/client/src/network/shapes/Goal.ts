import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from './Account';
import { Condition, getCondition, passesConditions } from './Conditional';
import { queryConditionsOf } from './Conditional/queries';
import { Reward, getReward } from './Rewards';
import { Score, getScoresByType } from './Score';
import { getEntityByHash, hashArgs, queryChildrenOfEntityIndex } from './utils';

/////////////////
// SHAPES

export interface Goal {
  id: EntityID;
  index: number;
  name: string;
  description: string;
  room: number;
  currBalance: number;
  objective: Condition;
  requirements: Condition[];
  rewards: GoalReward[];
  complete: boolean;
}

// Contribution represents details of individual's contribution to a goal
export interface Contribution extends Score {
  claimed?: boolean;
}

export interface GoalReward extends Reward {
  id: EntityID;
  cutoff: number;
  name: string;
  logic: string;
}

///////////////////
// FUNCTIONS

export const getAllGoals = (world: World, components: Components): Goal[] => {
  const { EntityType } = components;

  const queryFragments = [HasValue(EntityType, { value: 'GOAL' })];
  const raw = Array.from(runQuery(queryFragments));

  return raw.map((index): Goal => getGoal(world, components, index));
};

export const getGoalByIndex = (world: World, components: Components, index: number): Goal => {
  const entityIndex = getGoalEntityIndex(world, index);
  if (!entityIndex)
    return {
      id: '1' as EntityID,
      index: index,
      name: 'Goal not found',
      description: '',
      room: 0,
      currBalance: 0,
      objective: { id: '1' as EntityID, target: { type: '' }, logic: '' },
      requirements: [],
      rewards: [],
      complete: false,
    };

  return getGoal(world, components, entityIndex);
};

// sorts rewards by tier
export const sortRewards = (rewards: GoalReward[]): Map<string, GoalReward[]> => {
  rewards.sort((a, b) => a.cutoff - b.cutoff);

  const tiers = new Map<string, GoalReward[]>();
  for (let i = 0; i < rewards.length; i++) {
    if (rewards[i].logic === 'DISPLAY_ONLY') {
      // set display only rewards to the front
      // because their cutoff is 0, will be brought front during sort
      tiers.set(rewards[i].name, [rewards[i]]);
    } else {
      if (!tiers.has(rewards[i].name)) tiers.set(rewards[i].name, []);
      tiers.get(rewards[i].name)!.push(rewards[i]);
    }
  }

  return tiers;
};

export const canContribute = (
  world: World,
  components: Components,
  goal: Goal,
  account: Account
): [boolean, string] => {
  if (goal.complete) return [false, 'Goal already completed'];

  if (!passesConditions(world, components, goal.requirements, account))
    return [false, 'Requirements not met'];

  return [true, ''];
};

export const canClaim = (goal: Goal, contribution: Contribution | undefined): [boolean, string] => {
  if (!goal.complete) return [false, 'Goal still in progress (be patient!)'];

  if (!contribution || contribution.score == 0)
    return [false, 'You did not contribute - stop slacking and lock in, loser.'];
  else if (contribution.claimed) return [false, 'Already claimed!'];

  return [true, ''];
};

///////////////////
// SHAPES

export const getGoal = (world: World, components: Components, entityIndex: EntityIndex): Goal => {
  const { Value, Description, Index, IsComplete, Name, RoomIndex } = components;
  const goalID = world.entities[entityIndex];
  const goalIndex = getComponentValue(Index, entityIndex)?.value || (0 as number);

  return {
    id: goalID,
    index: goalIndex,
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    description: getComponentValue(Description, entityIndex)?.value || ('' as string),
    currBalance: (getComponentValue(Value, entityIndex)?.value || (0 as number)) * 1,
    objective: getCondition(world, components, getObjEntityIndex(world, goalID)),
    requirements: queryGoalRequirements(world, components, goalIndex),
    rewards: queryGoalRewards(world, components, goalIndex),
    complete: hasComponent(IsComplete, entityIndex) || (false as boolean),
    room: (getComponentValue(RoomIndex, entityIndex)?.value || (0 as number)) * 1,
  };
};

export const getGoalReward = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): GoalReward => {
  const { Level, LogicType, Name } = components;

  return {
    ...getReward(world, components, entityIndex),
    cutoff: getComponentValue(Level, entityIndex)?.value || (0 as number),
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    logic: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
  };
};

export const getContributions = (
  world: World,
  components: Components,
  goalID: EntityID
): Contribution[] => {
  return getScoresByType(world, components, goalID);
};

const getContribution = (
  components: Components,
  entityIndex: EntityIndex,
  account: Account
): Contribution => {
  const { Value, IsComplete } = components;

  return {
    account: account,
    claimed: getComponentValue(IsComplete, entityIndex)?.value || (false as boolean),
    score: (getComponentValue(Value, entityIndex)?.value || (0 as number)) * 1,
  };
};

export const getContributionByHash = (
  world: World,
  components: Components,
  goal: Goal,
  account: Account
): Contribution => {
  const entityIndex = getContributionEntityIndex(world, goal.id, account.id);

  if (!entityIndex) return { account: account, claimed: false, score: 0 };

  return getContribution(components, entityIndex, account);
};

/////////////////
// QUERIES

const queryGoalRequirements = (
  world: World,
  components: Components,
  goalIndex: number
): Condition[] => {
  return queryConditionsOf(world, components, 'goal.requirement', goalIndex);
};

const queryGoalRewards = (
  world: World,
  components: Components,
  goalIndex: number
): GoalReward[] => {
  return queryChildrenOfEntityIndex(components, 'goal.reward', goalIndex).map(
    (index): GoalReward => getGoalReward(world, components, index)
  );
};

//////////////////
// IDs

export const getGoalID = (index: number) => {
  return hashArgs(['goal', index], ['string', 'uint32']);
};

const getGoalEntityIndex = (world: World, goalIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['goal', goalIndex], ['string', 'uint32']);
};

const getContributionEntityIndex = (
  world: World,
  goalID: EntityID,
  accountID: EntityID
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['goal.contribution', goalID, accountID],
    ['string', 'uint256', 'uint256']
  );
};

const getObjEntityIndex = (world: World, goalID: EntityID): EntityIndex | undefined => {
  return getEntityByHash(world, ['goal.objective', goalID], ['string', 'uint256']);
};
