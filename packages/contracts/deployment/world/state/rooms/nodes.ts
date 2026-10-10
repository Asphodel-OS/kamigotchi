import { ethers } from 'ethers';

import { UintCompABI } from '../../../contracts/mappings/worldABIs';
import { getCompAddr } from '../../../utils/addresses';
import { getProvider } from '../../../utils/chain';
import { AdminAPI } from '../../api';
import { getSheet, toDelete, toRevise } from '../utils';
import { addScavengeDT, removeScavenge } from './scavenges';

// Initialize a single node from a data entry
async function initNode(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const item = entry['YieldIndex'];
  const name = entry['Name'];
  const description = 'placeholder';
  const affinity = entry['Affinity'].toUpperCase().replace(',', '-').replace(' ', '');

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
export async function initNodes(api: AdminAPI, indices?: number[], all?: boolean) {
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');
  if (indices && indices.length == 0) return console.log('No nodes given to initialize');
  console.log('\n==INITIALIZING NODES==');

  const validStatuses = ['To Deploy'];
  if (all || indices !== undefined) validStatuses.push('Ready', 'In Game', 'To Update');

  for (let i = 0; i < nodesCSV.length; i++) {
    const entry = nodesCSV[i];
    const index = Number(entry['Index']);
    const status = entry['Status'];

    // if indices are overridden skip any not included, otherwise check status
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    } else if (!validStatuses.includes(status)) continue;

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
      if (toDelete(nodesCSV[i])) indices.push(Number(nodesCSV[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      console.log(`Deleting node ${indices[i]}`);
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
      if (toRevise(nodesCSV[i])) indices.push(Number(nodesCSV[i]['Index']));
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

// adds the CSV Level Limit to live nodes without a revise (no delete, harvests untouched).
// add-only: there is no admin removal, so nodes already carrying a requirement are skipped
export async function addNodeRequirements(api: AdminAPI, indices: number[]) {
  if (!indices || indices.length == 0) return console.log('No nodes given: pass --args <indices>');
  const nodesCSV = await getSheet('rooms', 'nodes');
  if (!nodesCSV) return console.log('No rooms/nodes.csv found');
  console.log('\n==ADDING NODE REQUIREMENTS==');

  const anchorComp = new ethers.Contract(
    await getCompAddr('component.id.anchor'),
    UintCompABI,
    getProvider()
  );

  for (const index of indices) {
    const entry = nodesCSV.find((e: any) => Number(e['Index']) === index);
    if (!entry) {
      console.error(`Node ${index} not found in rooms/nodes.csv`);
      continue;
    }
    if (entry['Level Limit'] === '') {
      console.log(`Node ${index} has no Level Limit, skipping`);
      continue;
    }

    // mirrors LibNode.genReqAnchor
    const anchor = ethers.solidityPackedKeccak256(
      ['string', 'uint32'],
      ['node.requirement', index]
    );
    const existing: bigint[] = await anchorComp.getEntitiesWithValue(anchor);
    if (existing.length > 0) {
      console.log(`Node ${index} already has ${existing.length} requirement(s) on-chain, skipping`);
      continue;
    }
    await addRequirement(api, entry);
  }
}

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
