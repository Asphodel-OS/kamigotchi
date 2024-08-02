import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Reward, queryRewardsOf } from '../Rewards';

// Get the Entity Indices of the Rewards of a Quest
export const queryQuestRewards = (
  world: World,
  components: Components,
  questIndex: number
): Reward[] => {
  return queryRewardsOf(world, components, 'registry.quest.reward', questIndex);
};
