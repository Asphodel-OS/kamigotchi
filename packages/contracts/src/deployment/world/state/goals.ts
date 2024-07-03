import { AdminAPI } from '../admin';
import { MUSU_INDEX } from './utils';

export async function initGoals(api: AdminAPI) {
  await api.goal.create(
    1,
    'A hole in reality?',
    `The path beyond this point is blocked by some kind of…. glitched-out gate? 

You won’t be able to pass without using MUSU to stabilize this hole in reality. Looks like this one is going to need to be a team effort…`,
    47,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    20000
  );
  await api.goal.add.reward(1, 'Community', 0, 'Door unlock', 'DISPLAY_ONLY', 0, 0);
  await api.goal.add.reward(1, 'Bronze', 100, 'ITEM', 'REWARD', 106, 1);
  await api.goal.add.reward(1, 'Bronze', 100, 'REPUTATION', 'REWARD', 1, 5);
  await api.goal.add.reward(1, 'Silver', 300, 'ITEM', 'REWARD', 105, 2);
  await api.goal.add.reward(1, 'Silver', 300, 'REPUTATION', 'REWARD', 1, 10);
  await api.goal.add.reward(1, 'Gold', 1000, 'ITEM', 'REWARD', 104, 3);
  await api.goal.add.reward(1, 'Gold', 1000, 'REPUTATION', 'REWARD', 1, 25);

  await api.goal.create(
    2,
    'Void of Scrap',
    `Looks like you’d be able to get deeper into the scrapyard…. if it weren’t for this inconvenient hole in reality. 

You’ll need to contribute MUSU to open this path forward.`,
    34,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    100000
  );
  await api.goal.add.reward(2, 'Community', 0, 'Door unlock', 'DISPLAY_ONLY', 0, 0);
  await api.goal.add.reward(2, 'Bronze', 500, 'REPUTATION', 'REWARD', 1, 10);
  await api.goal.add.reward(2, 'Silver', 2500, 'REPUTATION', 'REWARD', 1, 20);
  await api.goal.add.reward(2, 'Gold', 5000, 'REPUTATION', 'REWARD', 1, 50);
}

export async function deleteGoals(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.delete(indices[i]);
  }
}
