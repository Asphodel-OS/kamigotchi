import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllGoals, getContributions, getGoal, getGoalByIndex } from 'network/shapes/Goals';

export const goals = (world: World, components: Components) => {
  return {
    all: () => getAllGoals(world, components),
    get: (entity: EntityIndex) => getGoal(world, components, entity),
    getByIndex: (index: number) => getGoalByIndex(world, components, index),
    contributions: (goalIndex: number) =>
      getContributions(world, components, getGoalByIndex(world, components, goalIndex).id),
  };
};
