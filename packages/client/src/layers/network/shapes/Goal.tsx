import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';

import { utils } from 'ethers';
import { Components } from 'layers/network';
import {
  Condition,
  getCondition,
  passesConditions,
} from 'layers/network/shapes/utils/Conditionals';
import { Account } from './Account';
import { Score, getScoresByType } from './Score';

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
  rewards: Reward[];
  complete: boolean;
}

// Contribution represents details of individual's contribution to a goal
export interface Contribution extends Score {
  claimed?: boolean;
}

export interface Reward {
  id: EntityID;
  cutoff: number;
  name: string;
  Reward: Condition;
}

///////////////////
// FUNCTIONS

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
export const sortRewards = (rewards: Reward[]): Map<string, Reward[]> => {
  rewards.sort((a, b) => a.cutoff - b.cutoff);

  const tiers = new Map<string, Reward[]>();
  for (let i = 0; i < rewards.length; i++) {
    if (rewards[i].value.logic === 'DISPLAY_ONLY') {
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
  const { Balance, Description, Index, IsComplete, Name, RoomIndex } = components;
  const goalID = world.entities[entityIndex];
  const goalIndex = getComponentValue(Index, entityIndex)?.value || (0 as number);

  return {
    id: goalID,
    index: goalIndex,
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    description: getComponentValue(Description, entityIndex)?.value || ('' as string),
    currBalance: getComponentValue(Balance, entityIndex)?.value || (0 as number),
    objective: getCondition(world, components, getObjEntityIndex(world, goalID)),
    requirements: queryGoalRequirements(world, components, goalIndex),
    rewards: queryGoalRewards(world, components, goalIndex),
    complete: hasComponent(IsComplete, entityIndex) || (false as boolean),
    room: getComponentValue(RoomIndex, entityIndex)?.value || (0 as number),
  };
};

export const getReward = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Reward => {
  const { Level, Name } = components;

  return {
    id: world.entities[entityIndex],
    cutoff: getComponentValue(Level, entityIndex)?.value || (0 as number),
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    Reward: getCondition(world, components, entityIndex),
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
  const { Balance, IsComplete } = components;

  return {
    account: account,
    claimed: getComponentValue(IsComplete, entityIndex)?.value || (false as boolean),
    score: getComponentValue(Balance, entityIndex)?.value || (0 as number),
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
  const { OwnsConditionID } = components;

  const pointerID = getReqPtr(goalIndex);

  const queryFragments = [HasValue(OwnsConditionID, { value: pointerID })];
  const raw = Array.from(runQuery(queryFragments));

  return raw.map((index): Condition => getCondition(world, components, index));
};

const queryGoalRewards = (world: World, components: Components, goalIndex: number): Reward[] => {
  const { OwnsConditionID } = components;

  const pointerID = getRwdPtr(goalIndex);

  const queryFragments = [HasValue(OwnsConditionID, { value: pointerID })];
  const raw = Array.from(runQuery(queryFragments));

  return raw.map((index): Reward => getReward(world, components, index));
};

/////////////////
// UTILS

export const getGoalID = (index: number) => {
  return utils.solidityKeccak256(['string', 'uint32'], ['goal', index]);
};

const getGoalEntityIndex = (world: World, goalIndex: number): EntityIndex | undefined => {
  const id = getGoalID(goalIndex);
  return world.entityToIndex.get(id as EntityID);
};

const getContributionEntityIndex = (
  world: World,
  goalID: EntityID,
  accountID: EntityID
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'uint256'],
    ['goal.contribution', goalID, accountID]
  );
  return world.entityToIndex.get(id as EntityID);
};

const getObjEntityIndex = (world: World, goalID: EntityID): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(['string', 'uint256'], ['goal.objective', goalID]);
  return world.entityToIndex.get(id as EntityID);
};

const getReqPtr = (goalIndex: number): EntityID => {
  const id = utils.solidityKeccak256(['string', 'uint32'], ['goal.requirement', goalIndex]);
  return id as EntityID;
};

const getRwdPtr = (goalIndex: number): EntityID => {
  const id = utils.solidityKeccak256(['string', 'uint32'], ['goal.reward', goalIndex]);
  return id as EntityID;
};
