import { AdminAPI } from '../../api';
import { getSheet, parseToInitCon } from '../utils';

export const Rewards = new Map<string, any>();

// retrieve the singleton Map of all Rewards
// if it hasn't been instantiated, populate it with the quest rewards sheet
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

// find and add all the rewards of a quest
export const addRewards = async (api: AdminAPI, questRow: any) => {
  const index = Number(questRow['Index']);

  const map = await getRewardsMap();
  const keys = questRow['Rewards'].split(',');
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) continue;

    const reward = map.get(key);
    if (reward) await addReward(api, index, reward);
    else console.log(`Error: Could not find Reward ${key}`);
  }
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
