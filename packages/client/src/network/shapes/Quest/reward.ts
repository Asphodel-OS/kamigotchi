import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Target } from '../Conditional';
import { queryConditionsOfEntityIndex } from '../Conditional/queries';

export interface Reward {
  id: EntityID;
  target: Target;
}

// Get a Reward Registry object
export const getReward = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Reward => {
  const { Value, Index, Type } = components;

  let reward: Reward = {
    id: world.entities[entityIndex],
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
    },
  };

  const index = getComponentValue(Index, entityIndex)?.value;
  if (index) reward.target.index = index;

  const value = getComponentValue(Value, entityIndex)?.value;
  if (value) reward.target.value = value;

  return reward;
};

// Get the Entity Indices of the Rewards of a Quest
export const queryQuestRewards = (
  world: World,
  components: Components,
  questIndex: number
): Reward[] => {
  return queryConditionsOfEntityIndex(components, 'registry.quest.reward', questIndex).map(
    (entityIndex) => getReward(world, components, entityIndex)
  );
};
