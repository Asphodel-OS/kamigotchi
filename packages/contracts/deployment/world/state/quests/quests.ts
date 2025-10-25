import { AdminAPI } from '../../api';
import { getSheet, toDelete, toRevise } from '../utils';
import { addObjectives } from './objectives';
import { addRequirements } from './requirements';
import { addRewards } from './rewards';

// STATE SCRIPTS SHOULD BE MODELED AFTER THIS DIRECTORY

// initialize a single quest
export const init = async (api: AdminAPI, entry: any): Promise<boolean> => {
  const index = Number(entry['Index']);
  const name = entry['Title'];
  const description = entry['Description'] ?? '';
  const altDescription = entry['Resolution text'] ?? '';
  const isDaily = entry['Daily'] === 'Yes';

  let success = true;
  try {
    console.log(`Creating ${isDaily ? 'Daily' : ''} Quest: ${index} (${name})`);
    await api.registry.quest.create(index, name, description, altDescription, isDaily ? 64800 : 0);
  } catch (e) {
    console.log(`Error: Failed to create Quest ${index}`);
    console.log(`  ${!!description} ${!!altDescription} ${isDaily}`);
    console.log(e);
    success = false;
  }
  return success;
};

/////////////////
// SCRIPTS

// initialize a specificified set of Quests or those with a valid status (if unspecified)
export async function initQuests(api: AdminAPI, indices?: number[], all?: boolean) {
  const csv = await getSheet('quests', 'quests');
  if (!csv) return console.log('No quests/quests.csv found');
  if (indices && indices.length == 0) return console.log('No quests given to initialize');
  console.log('\n==INITIALIZING QUESTS==');

  // TODO: support test environment statuses
  // TODO: standardize env->status mapping in shared helper function
  const validStatuses = ['To Deploy'];
  if (process.env.NODE_ENV !== 'production') validStatuses.push('Test');
  if (all || indices !== undefined) validStatuses.push('In Game');

  // process quests
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const index = Number(row['Index']);
    const status = row['Status'];

    // skip if quest isnt included in overridden indices
    // if indices arent overridden, skip if status isnt valid
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    } else if (!validStatuses.includes(status)) continue;

    // attempt to create the base quest entity
    const success = await init(api, row);

    if (!success) continue;
    await addRequirements(api, row);
    await addObjectives(api, row);
    await addRewards(api, row);
    await enable(api, index);
  }
}

// delete specified or marked quests
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

// revise specified or marked quests
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

export async function enable(api: AdminAPI, index: number) {
  try {
    // console.log(`Enabling quest ${index}`);
    await api.registry.quest.enable(index);
  } catch (e) {
    console.error(`!! Could not enable quest ${index}`, e);
  }
}
