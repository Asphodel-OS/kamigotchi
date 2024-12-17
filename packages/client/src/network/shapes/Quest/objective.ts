import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import {
  Condition,
  Status,
  checkBoolean,
  checkCurrent,
  checkLogicOperator,
  checkerSwitch,
  getCondition,
} from '../Conditional';
import { genID, getData, getEntityByHash, queryChildrenOf } from '../utils';
import { Quest } from './quest';

/////////////////
// SHAPES

export interface Objective extends Condition {
  name: string;
}

// Get an Objective Registry object
export const getObjective = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Objective => {
  const { Name } = components;

  return {
    ...getCondition(world, components, entityIndex),
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
  };
};

// Get the Entity Indices of the Objectives of a Quest
export const getObjectives = (
  world: World,
  components: Components,
  questIndex: number
): Objective[] => {
  const id = genID('registry.quest.objective', questIndex);
  const childEntities = queryChildrenOf(components, id);
  return childEntities.map((index) => getObjective(world, components, index));
};

/////////////////
// CHECKERS

// these are a bit odd as we ideally can just retrieve the quest from the registry
// q: should these be organized as objective.ts functions ?

export const checkObjective = (
  world: World,
  components: Components,
  objective: Objective,
  quest: Quest,
  account: Account
): Status => {
  if (quest.complete) {
    return { completable: true };
  }

  return checkerSwitch(
    objective.logic,
    checkCurrent(world, components, objective.target, account),
    checkIncrease(world, components, objective, quest, account),
    checkDecrease(world, components, objective, quest, account),
    checkBoolean(world, components, objective.target, account),
    { completable: false }
  );
};

const checkIncrease = (
  world: World,
  components: Components,
  objective: Objective,
  quest: Quest,
  account: Account
): ((opt: any) => Status) => {
  return (opt: any) => {
    const prevVal = getSnapshotValue(world, components, quest.id, objective);
    const currVal = getData(
      world,
      components,
      account.id,
      objective.target.type,
      objective.target.index
    );
    return {
      target: objective.target.value,
      current: currVal - prevVal,
      completable: checkLogicOperator(
        currVal - prevVal,
        objective.target.value ? objective.target.value : 0,
        opt
      ),
    };
  };
};

const checkDecrease = (
  world: World,
  components: Components,
  objective: Objective,
  quest: Quest,
  account: Account
): ((opt: any) => Status) => {
  return (opt: any) => {
    const prevVal = getSnapshotValue(world, components, quest.id, objective);
    const currVal = getData(
      world,
      components,
      account.id,
      objective.target.type,
      objective.target.index
    );
    return {
      target: objective.target.value,
      current: prevVal - currVal,
      completable: checkLogicOperator(
        prevVal - currVal,
        objective.target.value ? objective.target.value : 0,
        opt
      ),
    };
  };
};

/////////////////
// UTILS

const getSnapshotValue = (
  world: World,
  components: Components,
  questID: EntityID,
  obj: Objective
): number => {
  const entityIndex = getSnapshotEntity(world, questID, obj);
  if (!entityIndex) return 0;

  const { Value } = components;
  return ((getComponentValue(Value, entityIndex)?.value as number) || 0) * 1;
};

const getSnapshotEntity = (
  world: World,
  questID: EntityID,
  obj: Objective
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['quest.objective.snapshot', questID, obj.logic, obj.target.type, obj.target.index || 0],
    ['string', 'uint256', 'string', 'string', 'uint32']
  );
};
