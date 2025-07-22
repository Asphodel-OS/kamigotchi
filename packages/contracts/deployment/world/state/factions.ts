import { AdminAPI } from '../api';
import { getSheet } from './utils';

// initialize a single faction
async function initFaction(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const name = entry['Name'];
  const key = entry['Key'] ?? '';
  const description = entry['Description'] ?? '';
  console.log(`Creating Faction: ${name} (${index}: ${key})`);

  let success = true;
  try {
    await api.faction.create(index, name, description, key);
  } catch (e) {
    console.log(`Error: Failed to create Faction ${name}`);
    console.log(e);
    success = false;
  }
  return success;
}

/////////////////
// SCRIPTS

export async function initFactions(api: AdminAPI, indices?: number[]) {
  const csv = await getSheet('factions', 'factions');
  if (!csv) return console.log('No factions/factions.csv found');
  if (indices && indices.length == 0) return console.log('No factions given to initialize');
  console.log('\n==INITIALIZING FACTIONS==');

  // process factions
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const index = Number(row['Index']);

    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    }

    await initFaction(api, row);
  }
}

export async function reviseFactions(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  await deleteFactions(api, indices);
  await initFactions(api, indices);
}

export async function deleteFactions(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    try {
      console.log(`Deleting faction ${index}`);
      await api.faction.delete(index);
    } catch {
      console.error(`Could not delete faction ${index}`);
    }
  }
}
