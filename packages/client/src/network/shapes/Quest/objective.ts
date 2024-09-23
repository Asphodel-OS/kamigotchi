import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

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
import { getData, queryChildrenOfEntityIndex } from '../utils';
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
  return queryChildrenOfEntityIndex(components, 'registry.quest.objective', questIndex).map(
    (index) => getObjective(world, components, index)
  );
};

/////////////////
// QUERIES

export const querySnapshotObjective = (
  world: World,
  components: Components,
  questID: EntityID
): Objective => {
  const { OwnsQuestID } = components;
  // world2: update snapshot to flattened ID
  const entityIndices = Array.from(runQuery([HasValue(OwnsQuestID, { value: questID })]));
  return getObjective(world, components, entityIndices[0]); // should only be one
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
  const prevVal = querySnapshotObjective(world, components, quest.id).target.value as number;
  const currVal = getData(
    world,
    components,
    account.id,
    objective.target.type,
    objective.target.index
  );

  return (opt: any) => {
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
  const prevVal = querySnapshotObjective(world, components, quest.id).target.value as number;
  const currVal = getData(
    world,
    components,
    account.id,
    objective.target.type,
    objective.target.index
  );

  return (opt: any) => {
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
