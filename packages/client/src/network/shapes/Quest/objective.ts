import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition, getCondition } from '../Conditional';
import { queryChildrenOfEntityIndex } from '../utils';

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

/////////////////
// QUERIES

// Get the Entity Indices of the Objectives of a Quest
export const queryQuestObjectives = (
  world: World,
  components: Components,
  questIndex: number
): Objective[] => {
  return queryChildrenOfEntityIndex(components, 'registry.quest.objective', questIndex).map(
    (index) => getObjective(world, components, index)
  );
};

export const querySnapshotObjective = (
  world: World,
  components: Components,
  questID: EntityID
): Objective => {
  const { OwnsQuestID } = components;
  const entityIndices = Array.from(runQuery([HasValue(OwnsQuestID, { value: questID })]));
  return getObjective(world, components, entityIndices[0]); // should only be one
};
