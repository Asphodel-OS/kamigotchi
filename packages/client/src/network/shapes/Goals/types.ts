import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { Allo, getAllo } from '../Allo';
import { Condition, getCondition } from '../Conditional';
import { getConditionsOf } from '../Conditional/queries';
import { Score } from '../Score/types';
import { getEntityByHash, hashArgs, queryChildrenOf, queryRefsWithParent } from '../utils';

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
  tiers: Tier[];
  complete: boolean;
}

export interface Tier {
  id: EntityID;
  name: string;
  cutoff: number;
  rewards: Allo[];
}

// Contribution represents details of individual's contribution to a goal
export interface Contribution extends Score {
  claimed?: boolean;
}

export interface GoalReward extends Allo {
  id: EntityID;
  cutoff: number;
  name: string;
  logic: string;
}

///////////////////
// SHAPES

export const getGoal = (world: World, components: Components, entity: EntityIndex): Goal => {
  const { Value, Description, Index, IsComplete, Name, RoomIndex } = components;
  const goalID = world.entities[entity];
  const goalIndex = getComponentValue(Index, entity)?.value || (0 as number);

  return {
    id: goalID,
    index: goalIndex,
    name: getComponentValue(Name, entity)?.value || ('' as string),
    description: getComponentValue(Description, entity)?.value || ('' as string),
    currBalance: (getComponentValue(Value, entity)?.value || (0 as number)) * 1,
    objective: getCondition(world, components, getObjEntityIndex(world, goalID)),
    requirements: getGoalRequirements(world, components, goalIndex),
    tiers: getGoalTiers(world, components, goalIndex),
    complete: hasComponent(IsComplete, entity) || (false as boolean),
    room: (getComponentValue(RoomIndex, entity)?.value || (0 as number)) * 1,
  };
};

export const getContribution = (
  components: Components,
  entity: EntityIndex,
  account: Account
): Contribution => {
  const { Value, IsComplete } = components;

  return {
    account: account,
    claimed: getComponentValue(IsComplete, entity)?.value || (false as boolean),
    score: (getComponentValue(Value, entity)?.value || (0 as number)) * 1,
  };
};

const getGoalTiers = (world: World, components: Components, goalIndex: number): Tier[] => {
  const tiers = queryRefsWithParent(components, getTierAnchorID(goalIndex)).map(
    (entity: EntityIndex) => getTier(world, components, entity)
  );
  return tiers.sort((a, b) => a.cutoff - b.cutoff);
};

const getTier = (world: World, components: Components, entity: EntityIndex) => {
  const { Name, Value } = components;
  const id = world.entities[entity];
  return {
    id: id,
    name: getComponentValue(Name, entity)?.value || ('' as string),
    cutoff: (getComponentValue(Value, entity)?.value || (0 as number)) * 1,
    rewards: getTierRewards(world, components, id),
  };
};

const getGoalRequirements = (
  world: World,
  components: Components,
  goalIndex: number
): Condition[] => {
  return getConditionsOf(world, components, 'goal.requirement', goalIndex);
};

const getTierRewards = (world: World, components: Components, tierID: EntityID): Allo[] => {
  return queryChildrenOf(components, getRwdAnchorID(tierID)).map((index: EntityIndex) =>
    getAllo(world, components, index)
  );
};

//////////////////
// IDs

export const getGoalID = (index: number) => {
  return hashArgs(['goal', index], ['string', 'uint32']);
};

export const getGoalEntityIndex = (world: World, goalIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['goal', goalIndex], ['string', 'uint32']);
};

export const getContributionEntityIndex = (
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

export const getObjEntityIndex = (world: World, goalID: EntityID): EntityIndex | undefined => {
  return getEntityByHash(world, ['goal.objective', goalID], ['string', 'uint256']);
};

const getTierAnchorID = (goalIndex: number): EntityID => {
  return hashArgs(['goal.tier', goalIndex], ['string', 'uint32']);
};

const getRwdAnchorID = (tierID: EntityID): EntityID => {
  return hashArgs(['goal.reward', tierID], ['string', 'uint256'], true);
};
