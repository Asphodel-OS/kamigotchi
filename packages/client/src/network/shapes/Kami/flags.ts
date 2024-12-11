import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { hasFlag } from '../Flag';

export interface Flags {
  namable: boolean;
  skillReset: boolean;
}

// get the flags of a kami entity
export const getFlags = (world: World, components: Components, entity: EntityIndex): Flags => {
  const id = world.entities[entity];
  return {
    namable: !hasFlag(world, components, id, 'NOT_NAMEABLE'),
    skillReset: hasFlag(world, components, id, 'CAN_RESET_SKILLS'),
  };
};
