import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Target } from './Conditional';
import { Droptable, NullDT, getDroptable } from './Droptable';
import { queryChildrenOfEntityIndex } from './utils';

export interface Reward {
  id: EntityID;
  type: string;
  target: Target;
  droptable: Droptable;
}

// Get a Reward Registry object
export const getReward = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Reward => {
  const { Value, Index, Type } = components;

  const type = getComponentValue(Type, entityIndex)?.value || ('' as string);

  // assigning either target (basic) or droptable
  let droptable: Droptable;
  let target: Target;
  if (type.includes('ITEM_DROPTABLE')) {
    droptable = getDroptable(components, entityIndex);
    target = { type: type };
  } else {
    target = {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
      index: getComponentValue(Index, entityIndex)?.value || (0 as number),
      value: (getComponentValue(Value, entityIndex)?.value || (0 as number)) * 1,
    };
    droptable = NullDT;
  }

  return {
    id: world.entities[entityIndex],
    type: type,
    target: target,
    droptable: droptable,
  };
};

export const queryRewardsOf = (
  world: World,
  components: Components,
  field: string,
  index: number
): Reward[] => {
  return queryChildrenOfEntityIndex(components, field, index).map((entityIndex: EntityIndex) =>
    getReward(world, components, entityIndex)
  );
};
