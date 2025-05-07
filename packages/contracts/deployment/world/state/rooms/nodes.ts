import { AdminAPI } from '../../api';
import { getSheet, toDelete, toRevise } from '../utils';
import { addScavengeDT, removeScavenge } from './scavenges';

// Initialize a single node from a data entry
async function initNode(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const item = entry['YieldIndex'];
  const name = entry['Name'];
  const description = 'placeholder';
  const affinity = entry['Affinity'].toUpperCase();

  try {
    console.log(`Creating Node: (${index}) ${name} (${affinity})`);
    await api.node.create(index, 'HARVEST', item, index, name, description, affinity);
  } catch (e) {
    console.error(`Could not create node ${index}`, e);
  }
}

///////////////////
// SCRIPTS

// TODO: properly gate this based on status and room existence
export async function initNodes(api: AdminAPI, indices?: number[]) {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');
  console.log('\n==INITIALIZING NODES==');

  for (let i = 0; i < nodesCSV.length; i++) {
    const entry = nodesCSV[i];
    const index = Number(entry['Index']);

    // if indices are overriden, skip if index isn't included
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    }

    try {
      await initNode(api, entry);
      if (entry['Level Limit'] !== '') await addRequirement(api, entry);
      if (entry['Scav Cost'] !== '') await addScavengeDT(api, entry);
    } catch {
      console.error(`Could not create node ${index}`);
    }
  }
}

// delete a set of nodes, either all or explicitly by a set of indices
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

// NOTE: should always use override indices for the time being
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

///////////////////
// SCAVENGES

export async function addNodeScavenge(api: AdminAPI, nodeEntry: any) {
  await addScavengeDT(api, nodeEntry);
}

export const addNodeScavenges = async (api: AdminAPI, indices?: number[]) => {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');

  let entry: any;
  let nodeIndex: number;
  for (let i = 0; i < nodesCSV.length; i++) {
    entry = nodesCSV[i];
    nodeIndex = Number(entry['Index']);
    if (indices && !indices.includes(nodeIndex)) continue;
    await addNodeScavenge(api, entry);
  }
};

// revise the scavenge on a node entry based on sheet data
// removes and re-adds the scavenge
export async function reviseNodeScavenge(api: AdminAPI, nodeEntry: any) {
  const nodeIndex = Number(nodeEntry['Index']);
  await removeScavenge(api, nodeIndex);
  await addScavengeDT(api, nodeEntry);
}

// revise multiple node scavenges at once
export async function reviseNodeScavenges(api: AdminAPI, indices?: number[]) {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');

  let entry: any;
  let nodeIndex: number;
  for (let i = 0; i < nodesCSV.length; i++) {
    entry = nodesCSV[i];
    nodeIndex = Number(entry['Index']);
    if (indices && !indices.includes(nodeIndex)) continue;
    await reviseNodeScavenge(api, entry);
  }
}

///////////////////
// REQUIREMENTS

// hardcoded to only allow max levels rn
async function addRequirement(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const limit = Number(entry['Level Limit']);

  try {
    console.log(`  adding level ${limit} requirement for node ${index}`);
    await api.node.requirement.add(index, 'LEVEL', 'CURR_MAX', 0, limit, 'KAMI');
  } catch (e) {
    console.error(`Could not create level requirement for node ${index}`, e);
  }
}
