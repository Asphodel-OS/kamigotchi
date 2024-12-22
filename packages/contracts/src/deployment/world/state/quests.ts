import { AdminAPI } from '../admin';
import {
  GACHA_TICKET_INDEX,
  parseToInitCon,
  readFile,
  toCreate,
  toDelete,
  toRevise,
} from './utils';

export async function initQuests(api: AdminAPI, overrideIndices?: number[]) {
  const questCSV = await readFile('quests/quests.csv');
  for (let i = 0; i < questCSV.length; i++) {
    const quest = questCSV[i];

    // skip if indices are overridden and quest isn't included
    if (
      overrideIndices &&
      overrideIndices.length > 0 &&
      !overrideIndices.includes(Number(quest['Index']))
    )
      continue;

    try {
      if (!toCreate(quest)) continue;
      if (quest['Class'] === 'Quest' || quest['Class'] === '') await initQuest(api, quest);
      else if (quest['Class'] === 'Requirement') await initQuestRequirement(api, quest);
      else if (quest['Class'] === 'Objective') await initQuestObjective(api, quest);
      else if (quest['Class'] === 'Reward') await initQuestReward(api, quest);
    } catch {
      console.error('Could not create quest', quest['Class'], quest['Index']);
    }
  }
}

export async function initLocalQuests(api: AdminAPI) {
  api.registry.quest.create(
    1000000,
    'The Chosen Taruchi',
    'Hey there! You look like someone with good taste. Ever heard of a Kamigotchi? \n You need one to play the game - here, take 5!',
    'Was it really worth it?',
    0
  );
  api.registry.quest.add.reward.basic(1000000, 'ITEM', GACHA_TICKET_INDEX, 111); // 111 tickets
}

export async function deleteQuests(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const questsCSV = await readFile('quests/quests.csv');
    for (let i = 0; i < questsCSV.length; i++) {
      if (toDelete(questsCSV[i])) indices.push(Number(questsCSV[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      await api.registry.quest.delete(indices[i]);
    } catch {
      console.error('Could not delete quest ' + indices[i]);
    }
  }
}

export async function reviseQuests(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const questsCSV = await readFile('quests/quests.csv');
    for (let i = 0; i < questsCSV.length; i++) {
      if (toRevise(questsCSV[i])) indices.push(Number(questsCSV[i]['Index']));
    }
  }

  await deleteQuests(api, indices);
  await initQuests(api, indices);
}

async function initQuest(api: AdminAPI, entry: any) {
  await api.registry.quest.create(
    Number(entry['Index']),
    entry['Title'],
    entry['Introduction text'],
    entry['Resolution text'],
    entry['Daily'] === 'Yes' ? 64800 : 0
  );

  const agencyRep = Number(entry['REPUTATION']);
  if (agencyRep || agencyRep > 0) {
    await api.registry.quest.add.reward.basic(Number(entry['Index']), 'REPUTATION', 1, agencyRep);
  }
}

async function initQuestRequirement(api: AdminAPI, entry: any) {
  const cond = parseToInitCon(
    entry['Operator'],
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
  await api.registry.quest.add.requirement(
    Number(entry['Index']),
    cond.logicType,
    cond.type,
    cond.index,
    cond.value,
    ''
  );
}

async function initQuestObjective(api: AdminAPI, entry: any) {
  const cond = parseToInitCon(
    '', // objective logic operators alr processed
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
  await api.registry.quest.add.objective(
    Number(entry['Index']),
    entry['ConditionDescription'],
    entry['DeltaType'] + '_' + entry['Operator'],
    cond.type,
    cond.index,
    cond.value,
    ''
  );
}

async function initQuestReward(api: AdminAPI, entry: any) {
  const cond = parseToInitCon(
    '', // no reward logic operators
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
  await api.registry.quest.add.reward.basic(
    Number(entry['Index']),
    cond.type,
    cond.index,
    cond.value
  );
}
