import questCSV from 'assets/data/quests/quests.csv';
import { parseToLogicType } from 'layers/network/shapes/utils/Conditionals';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initQuests(api: AdminAPI) {
  for (let i = 0; i < questCSV.length; i++) {
    const quest = questCSV[i];
    await sleepIf();
    try {
      if (quest['Status'] !== 'For Implementation') continue;
      if (quest['Class'] === 'Quest' || quest['Class'] === '') await initQuest(api, quest);
      else if (quest['Class'] === 'Requirement') await initQuestRequirement(api, quest);
      else if (quest['Class'] === 'Objective') await initQuestObjective(api, quest);
      else if (quest['Class'] === 'Reward') await initQuestReward(api, quest);
    } catch {}
  }
}

export async function initLocalQuests(api: AdminAPI) {
  api.registry.quest.create(
    1000000,
    'The Chosen Taruchi',
    'Hey there! You look like someone with good taste. Ever heard of a Kamigotchi? \n You need one to play the game - here, take 5!',
    'Was it really worth it?',
    0,
    0
  );
  api.registry.quest.add.reward(1000000, 'MINT20', 0, 111);
}

export async function initQuest(api: AdminAPI, entry: any) {
  await api.registry.quest.create(
    Number(entry['Index']),
    entry['Title'],
    entry['Introduction text'],
    entry['Resolution text'],
    entry['Daily'] === 'Yes' ? 64800 : 0
  );
}

export async function initQuestRequirement(api: AdminAPI, entry: any) {
  // console.log('req', entry['Index']);
  await api.registry.quest.add.requirement(
    Number(entry['Index']),
    parseToLogicType(entry['Operator']),
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
}

export async function initQuestObjective(api: AdminAPI, entry: any) {
  // console.log('obj', entry['Index']);
  await api.registry.quest.add.objective(
    Number(entry['Index']),
    entry['ConditionDescription'],
    entry['DeltaType'] + '_' + entry['Operator'],
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
}

export async function initQuestReward(api: AdminAPI, entry: any) {
  // console.log('reward', entry['Index']);
  await api.registry.quest.add.reward(
    Number(entry['Index']),
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
}

export async function initQuestsByIndex(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < questCSV.length; i++) {
    const quest = questCSV[i];
    if (!indices.includes(Number(quest['Index']))) continue;
    await sleepIf();
    try {
      if (quest['Status'] !== 'For Implementation') continue;
      if (quest['Class'] === 'Quest' || quest['Class'] === '') await initQuest(api, quest);
      else if (quest['Class'] === 'Requirement') await initQuestRequirement(api, quest);
      else if (quest['Class'] === 'Objective') await initQuestObjective(api, quest);
      else if (quest['Class'] === 'Reward') await initQuestReward(api, quest);
    } catch {}
  }
}

export async function deleteQuests(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await sleepIf();
    try {
      await api.registry.quest.delete(indices[i]);
    } catch {
      console.error('Could not delete quest ' + indices[i]);
    }
  }
}
