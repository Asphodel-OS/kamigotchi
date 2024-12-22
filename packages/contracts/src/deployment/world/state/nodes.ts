import { AdminAPI } from '../admin';
import { readFile, textToNumberArray, toDelete, toRevise } from './utils';

export async function initNodes(api: AdminAPI, overrideIndices?: number[]) {
  // nodes data are stored in rooms csv
  const roomsCSV = await readFile('rooms/rooms.csv');

  for (let i = 0; i < roomsCSV.length; i++) {
    const entry = roomsCSV[i];

    // skip if indices are overridden and entry isn't included
    if (overrideIndices && !overrideIndices.includes(Number(entry['Index']))) continue;

    if (entry['Enabled'] !== 'true') continue;
    if (entry['Node'] === '' || entry['Node'] === 'NONE') continue;
    try {
      await initNode(api, entry);
      if (entry['Scav Cost'] !== '') await initScavBar(api, entry);
      if (entry['Level Limit'] !== '') await initRequirement(api, entry);
    } catch {
      console.error('Could not create node', entry['Index']);
    }
  }
}

export async function deleteNodes(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const nodesCSV = await readFile('rooms/rooms.csv');
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
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const nodesCSV = await readFile('rooms/rooms.csv');
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
  await api.node.create(
    Number(entry['Index']),
    'HARVEST', // all nodes are harvesting nodes rn
    Number(entry['Index']),
    entry['Name'],
    entry['Description'],
    entry['Affinity'].toUpperCase()
  );
}

// hardcoded to only allow max levels rn
async function initRequirement(api: AdminAPI, entry: any) {
  await api.node.add.requirement(
    Number(entry['Index']),
    'LEVEL',
    'CURR_MAX',
    0,
    Number(entry['Level Limit']),
    'KAMI'
  );
}

// creates both scavBar and its reward at once. assumes each scav bar only has one reward, a DT
async function initScavBar(api: AdminAPI, entry: any) {
  await api.node.add.scav(Number(entry['Index']), Number(entry['Scav Cost']));
  await api.node.add.scavReward.droptable(
    Number(entry['Index']),
    textToNumberArray(entry['Item Drop Indices']),
    textToNumberArray(entry['Item Drop Weights']),
    1
  );
}
