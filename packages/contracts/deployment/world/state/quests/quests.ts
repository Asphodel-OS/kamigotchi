import { AdminAPI } from '../../api';
import { GACHA_TICKET_INDEX, getSheet, toDelete, toRevise } from '../utils';
import { addObjective, getObjectivesMap } from './objectives';
import { addRequirement, getRequirementsMap } from './requirements';
import { addReward, getRewardsMap } from './rewards';

export const initQuest = async (api: AdminAPI, entry: any): Promise<boolean> => {
  const index = Number(entry['Index']);
  const name = entry['Title'];
  const description = entry['Description'] ?? '';
  const altDescription = entry['Resolution text'] ?? '';
  const isDaily = entry['Daily'] === 'Yes';
  console.log(`Creating ${isDaily ? 'Daily' : ''} Quest: ${index} (${name})`);

  let success = true;
  try {
    await api.registry.quest.create(index, name, description, altDescription, isDaily ? 64800 : 0);
  } catch (e) {
    console.log(`Error: Failed to create Quest ${index}`);
    console.log(`  ${!!description} ${!!altDescription} ${isDaily}`);
    console.log(e);
    success = false;
  }
  return success;

  // const agencyRep = Number(entry['REPUTATION']);
  // if (agencyRep || agencyRep > 0) {
  //   await api.registry.quest.add.reward.basic(Number(entry['Index']), 'REPUTATION', 1, agencyRep);
  // }
};

///////////////////
// SCRIPTS

export async function initQuests(api: AdminAPI, indices?: number[], local?: boolean) {
  const csv = await getSheet('quests', 'quests');
  if (!csv) return console.log('No quests/quests.csv found');
  console.log('\n==INITIALIZING QUESTS==');

  // TODO: support test environment statuses
  // TODO: standardize env->status mapping in helper shared helper function
  const validStatuses = ['To Deploy'];
  if (local) validStatuses.push('In Game', 'Test');
  console.log('valid statuses', validStatuses);

  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const index = Number(row['Index']);
    const name = row['Title'];
    const status = row['Status'];

    // skip if quest isnt included in overridden indices
    // if indices arent overriden, skip if status isnt valid
    if (indices && indices.length > 0) {
      console.log('indices', indices);
      if (!indices.includes(index)) continue;
    } else if (!validStatuses.includes(status)) continue;

    // attempt to create the base quest entity
    const success = await initQuest(api, row);
    if (!success) continue;

    // find and add all the requirements
    const requirementsMap = await getRequirementsMap();
    const requirements = row['Requirements'].split(',');
    for (let i = 0; i < requirements.length; i++) {
      const key = requirements[i];
      const req = requirementsMap.get(key);
      if (req) await addRequirement(api, index, req);
      else console.log(`Error: Could not find Requirement ${key}`);
    }

    // find and add all the objectives
    const objectivesMap = await getObjectivesMap();
    const objectives = row['Objectives'].split(',');
    for (let i = 0; i < objectives.length; i++) {
      const key = objectives[i];
      const obj = objectivesMap.get(key);
      if (obj) await addObjective(api, index, obj);
      else console.log(`Error: Could not find Objective ${key}`);
    }

    // find and add all the rewards
    const rewardsMap = await getRewardsMap();
    const rewards = row['Rewards'].split(',');
    for (let i = 0; i < rewards.length; i++) {
      const key = rewards[i];
      const rew = rewardsMap.get(key);
      if (rew) await addReward(api, index, rew);
      else console.log(`Error: Could not find Reward ${key}`);
    }
  }
}

// initialize local quests
// TODO: move this to sheet based local deploys
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

// delete quests
export async function deleteQuests(api: AdminAPI, overrideIndices?: number[]) {
  const csv = await getSheet('quests', 'quests');
  if (!csv) return console.log('No quests/quests.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < csv.length; i++) {
      if (toDelete(csv[i])) indices.push(Number(csv[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    try {
      console.log(`Deleting quest ${index}`);
      await api.registry.quest.delete(index);
    } catch (e) {
      console.error(`!! Could not delete quest ${index}`, e);
    }
  }
}

export async function reviseQuests(api: AdminAPI, overrideIndices?: number[]) {
  const csv = await getSheet('quests', 'quests');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < csv.length; i++) {
      const row = csv[i];
      const index = Number(row['Index']);
      if (toRevise(row)) indices.push(index);
    }
  }

  await deleteQuests(api, indices);
  await initQuests(api, indices);
}

///////////////////

// async function initQuestObjective(api: AdminAPI, entry: any) {
//   const cond = parseToInitCon(
//     '', // objective logic operators alr processed
//     entry['SubType'],
//     Number(entry['IndexFor'] ?? 0),
//     Number(entry['ValueFor'] ?? 0)
//   );
//   await api.registry.quest.add.objective(
//     Number(entry['Index']),
//     entry['ConditionDescription'],
//     entry['DeltaType'] + '_' + entry['Operator'],
//     cond.type,
//     cond.index,
//     cond.value,
//     ''
//   );
// }

// async function initQuestReward(api: AdminAPI, entry: any) {
//   const cond = parseToInitCon(
//     '', // no reward logic operators
//     entry['SubType'],
//     Number(entry['IndexFor'] ?? 0),
//     Number(entry['ValueFor'] ?? 0)
//   );
//   await api.registry.quest.add.reward.basic(
//     Number(entry['Index']),
//     cond.type,
//     cond.index,
//     cond.value
//   );
// }
