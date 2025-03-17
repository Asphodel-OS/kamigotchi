import { AdminAPI } from '../../api';
import { getSheet, toDelete, toRevise } from '../utils';
import { addScavenge } from './scavenges';

// TODO: properly gate this based on status and room existence
export async function initNodes(api: AdminAPI, overrideIndices?: number[]) {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');
  console.log('\n==INITIALIZING NODES==');

  for (let i = 0; i < nodesCSV.length; i++) {
    const entry = nodesCSV[i];
    const index = Number(entry['Index']);

    // skip if indices are overridden and entry isn't included
    if (overrideIndices && !overrideIndices.includes(index)) continue;

    try {
      await initNode(api, entry);
      if (entry['Level Limit'] !== '') await addRequirement(api, entry);
      if (entry['Scav Cost'] !== '') await addScavenge(api, entry);
    } catch {
      console.error(`Could not create node ${index}`);
    }
  }
}

export async function deleteNodes(api: AdminAPI, overrideIndices?: number[]) {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < nodesCSV.length; i++) {
      if (
        toDelete(nodesCSV[i]) &&
        nodesCSV[i]['Enabled'] === 'true' &&
        nodesCSV[i]['Node'] !== 'NONE'
      )
        indices.push(Number(nodesCSV[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      await api.node.delete(indices[i]);
    } catch {
      console.error('Could not delete node ' + indices[i]);
    }
  }
}

export async function reviseNodes(api: AdminAPI, overrideIndices?: number[]) {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < nodesCSV.length; i++) {
      if (
        toRevise(nodesCSV[i]) &&
        nodesCSV[i]['Enabled'] === 'true' &&
        nodesCSV[i]['Node'] !== 'NONE'
      )
        indices.push(Number(nodesCSV[i]['Index']));
    }
  }

  await deleteNodes(api, indices);
  await initNodes(api, indices);
}

async function initNode(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const name = entry['Name'];
  const description = 'placeholder';
  const affinity = entry['Affinity'].toUpperCase();

  try {
    console.log(`Creating Node: (${index}) ${name} (${affinity})`);
    await api.node.create(index, 'HARVEST', index, name, description, affinity);
  } catch (e) {
    console.error(`Could not create node ${index}`, e);
  }
}

// hardcoded to only allow max levels rn
async function addRequirement(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const limit = Number(entry['Level Limit']);

  try {
    console.log(`  adding level ${limit} requirement for node ${index}`);
    await api.node.add.requirement(index, 'LEVEL', 'CURR_MAX', 0, limit, 'KAMI');
  } catch (e) {
    console.error(`Could not create level requirement for node ${index}`, e);
  }
}
