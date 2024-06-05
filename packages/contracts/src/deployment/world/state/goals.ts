import { AdminAPI } from '../admin';
import { MUSU_INDEX } from './utils';

export async function initGoals(api: AdminAPI) {
  await api.goal.create(
    1,
    'Door-kun',
    `This is a cruel world, and someone just decided to make it even crueler by locking up this door. Although, not everything is lost: they're demanding $2000 KAMI to open it. We're pooling up funds — chip in?`,
    47,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    20000
  );
  await api.goal.add.reward(1, 'Community', 0, 'Door unlock', 'DISPLAY_ONLY', 0, 0);
  await api.goal.add.reward(1, 'Bronze', 100, 'ITEM', 'REWARD', 101, 1);
  await api.goal.add.reward(1, 'Silver', 400, 'ITEM', 'REWARD', 102, 2);
  await api.goal.add.reward(1, 'Gold', 800, 'ITEM', 'REWARD', 103, 3);
}

export async function deleteGoals(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.delete(indices[i]);
  }
}
