import { AdminAPI } from '../admin';
import { parseToInitCon, readFile } from './utils';

export async function initQuests(api: AdminAPI, overrideIndices?: number[]) {
  const questCSV = await readFile('quests/quests.csv');
  for (let i = 0; i < questCSV.length; i++) {
    const quest = questCSV[i];

    // skip if indices are overridden and quest isn't included
    if (overrideIndices && !overrideIndices.includes(Number(quest['Index']))) continue;

    try {
      if (
        quest['Status'] !== 'For Implementation' &&
        quest['Status'] !== 'Revise Deployment' &&
        quest['Status'] !== 'Ingame' // a lil clunky to accommodate notion
      )
        continue;
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
  api.registry.quest.add.reward(1000000, 'MINT20', 0, 111);
}

export async function deleteQuests(api: AdminAPI, indices: number[]) {
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
      if (questsCSV[i]['Status'] === 'Revise Deployment')
        indices.push(Number(questsCSV[i]['Index']));
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

  const agencyRep = Number(entry['Agency Rep']);
  if (agencyRep || agencyRep > 0) {
    await api.registry.quest.add.reward(Number(entry['Index']), 'REPUTATION', 1, agencyRep);
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
    cond.value
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
    cond.value
  );
}

async function initQuestReward(api: AdminAPI, entry: any) {
  const cond = parseToInitCon(
    '', // no reward logic operators
    entry['SubType'],
    Number(entry['IndexFor'] ?? 0),
    Number(entry['ValueFor'] ?? 0)
  );
  await api.registry.quest.add.reward(Number(entry['Index']), cond.type, cond.index, cond.value);
}
