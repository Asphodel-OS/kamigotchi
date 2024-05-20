import { AdminAPI } from '../admin';

export async function initGoals(api: AdminAPI) {
  await api.goal.create(
    1,
    'Door-kun',
    `This is a cruel world, and someone just decided to make it even crueler by locking up this door. Although, not everything is lost: they're demanding $2000 KAMI to open it. We're pooling up funds — chip in?`,
    47,
    'COIN',
    'CURR_MIN',
    0,
    20000
  );
  await api.goal.add.reward(1, 'Door unlock', 'DISPLAY_ONLY', 0, 0);
  await api.goal.add.reward(1, 'ITEM', 'PROPORTIONAL', 2, 400);
  await api.goal.add.reward(1, 'ITEM', 'EQUAL', 1, 1);
}

export async function deleteGoals(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.delete(indices[i]);
  }
}
