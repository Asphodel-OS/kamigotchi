import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllFactions, getFactionByIndex } from 'network/shapes/Faction';

export const factions = (world: World, components: Components) => {
  return {
    all: () => getAllFactions(world, components),
    get: (index: number) => getFactionByIndex(world, components, index),
    indices: () => Array.from(components.FactionIndex.values.value.values()),
  };
};
