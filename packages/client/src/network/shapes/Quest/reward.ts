import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Reward, queryRewardsOf } from '../Rewards';

// Get the Entity Indices of the Rewards of a Quest
export const queryQuestRewards = (
  world: World,
  components: Components,
  questIndex: number
): Reward[] => {
  let results = queryRewardsOf(world, components, 'registry.quest.reward', questIndex);
  // sort rewards so reputation are always first
  results.sort((x, y) => {
    if (x.target.type === 'REPUTATION') return -1;
    if (y.target.type === 'REPUTATION') return 1;
    return 0;
  });
  return results;
};

export const getRewardText = (reward: Reward, name = ''): string => {
  const value = (reward.target.value ?? 0) * 1;

  if (reward.target.type === 'ITEM') {
    return `x${value} ${name}`;
  } else if (reward.target.type === 'EXPERIENCE') {
    return `${value} Experience`;
  } else if (reward.target.type === 'MINT20') {
    return `${value} ${name}`;
  } else if (reward.target.type === 'REPUTATION') {
    return `${value} REP`;
  } else if (reward.target.type === 'NFT') {
    return `Kamigotchi World Passport`;
  } else {
    return '???';
  }
};
