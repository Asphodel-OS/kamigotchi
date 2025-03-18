import { AdminAPI } from '../../api';
import { getSheet, parseToInitCon } from '../utils';

export const Rewards = new Map<string, any>();

// get or generate the singleton Map of all Rewards
export const getRewardsMap = async () => {
  if (Rewards.size > 0) return Rewards;

  const csv = await getSheet('quests', 'rewards');
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const key = row['Description'];
    if (!Rewards.has(key)) Rewards.set(key, row);
  }
  return Rewards;
};

// add a reward to a quest
export const addReward = async (api: AdminAPI, questIndex: number, entry: any) => {
  const key = entry['Description'];
  const type = entry['Type'];
  const index = Number(entry['Index'] ?? 0);
  const value = Number(entry['Value'] ?? 0);
  console.log(`  Adding Reward ${key} - (${type}) (${index}) (${value})`);

  try {
    const cond = parseToInitCon('', type, index, value);
    await api.registry.quest.add.reward.basic(questIndex, cond.type, cond.index, cond.value);
  } catch (e) {
    console.log(`Error: Failed to add Reward`);
    console.log(e);
  }
};
