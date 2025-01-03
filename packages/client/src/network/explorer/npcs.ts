import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllNPCs, getNPC, getNPCByIndex } from 'network/shapes/Npc';

export const npcs = (world: World, components: Components) => {
  return {
    all: () => getAllNPCs(world, components, { listings: true }),
    get: (entity: EntityIndex) => getNPC(world, components, entity, { listings: true }),
    getByIndex: (index: number) => getNPCByIndex(world, components, index, { listings: true }),
    indices: () => Array.from(components.NPCIndex.values.value.values()),
  };
};
