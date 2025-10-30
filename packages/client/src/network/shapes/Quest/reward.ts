import { EntityID, World } from 'engine/recs';

import { Components } from 'network/';
import { Allo, getAllosOf } from '../Allo';
import { hashArgs } from '../utils';

// Get the Entity Indices of the Rewards of a Quest
export const getRewards = (world: World, components: Components, questIndex: number): Allo[] => {
  let results = getAllosOf(world, components, genAlloAnchorID(questIndex));
  // sort rewards so reputation are always first
  results.sort((x, y) => {
    if (x.type === 'REPUTATION') return -1;
    if (y.type === 'REPUTATION') return 1;
    return 0;
  });
  return results;
};

export const getRewardText = (reward: Allo, name = ''): string => {
  const value = (reward.value ?? 0) * 1;

  if (reward.type === 'ITEM') {
    return `x${value}`;
  } else if (reward.type === 'EXPERIENCE') {
    return `${value} Experience`;
  } else if (reward.type === 'MINT20') {
    return `${value} ${name}`;
  } else if (reward.type === 'REPUTATION') {
    return `x${value}`;
  } else if (reward.type === 'NFT') {
    return `Kamigotchi World Passport`;
  } else {
    return '???';
  }
};

const genAlloAnchorID = (questIndex: number): EntityID => {
  return hashArgs(['registry.quest.reward', questIndex], ['string', 'uint32']);
};
