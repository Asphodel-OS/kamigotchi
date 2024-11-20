import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllGoals, getGoalByIndex } from 'network/shapes/Goals';

export const goals = (world: World, components: Components) => {
  return {
    all: () => getAllGoals(world, components),
    get: (index: number) => getGoalByIndex(world, components, index),
  };
};
