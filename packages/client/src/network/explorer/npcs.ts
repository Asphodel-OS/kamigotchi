import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllNPCs, getNPC, getNPCByIndex } from 'network/shapes/NPCs';

export const npcs = (world: World, components: Components) => {
  return {
    all: () => getAllNPCs(world, components),
    get: (entity: EntityIndex) => getNPC(world, components, entity),
    getByIndex: (index: number) => getNPCByIndex(world, components, index),
    indices: () => Array.from(components.NPCIndex.values.value.values()),
  };
};
