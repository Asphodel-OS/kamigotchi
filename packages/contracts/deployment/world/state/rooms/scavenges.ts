import { AdminAPI } from '../../api';
import { getSheet, textToNumberArray } from '../utils';

export const Droptables = new Map<string, any>();

// retrieve the singleton Map of all (scavenge) Droptables
// if uninstantiated, populate it with the respective sheet
export const getDroptablesMap = async () => {
  if (Droptables.size > 0) return Droptables;

  const csv = await getSheet('rooms', 'droptables');
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const key = row['Name'];
    if (!Droptables.has(key)) Droptables.set(key, row);
  }
  return Droptables;
};

// creates a Scavenge bar on a node and adds its Droptable reward at once.
// assumes each Scavenge bar only has a single (Droptable) reward
export async function addScavengeDT(api: AdminAPI, nodeEntry: any) {
  const map = await getDroptablesMap();

  const nodeIndex = Number(nodeEntry['Index']);
  const cost = Number(nodeEntry['Scav Cost']);
  const scavKey = nodeEntry['Drops'];

  const scavEntry = map.get(scavKey);
  if (!scavEntry) {
    return console.error(`Error: Could not find Scavenge data for node ${nodeIndex}`);
  }

  const indices = textToNumberArray(scavEntry['Indices']);
  const weights = textToNumberArray(scavEntry['Tiers']);

  try {
    console.log(
      `  adding Scavenge for node ${nodeIndex} with cost ${cost}`,
      `\n  drops: (${indices.join(', ')}) with weights: (${weights.join(', ')})`
    );
    await api.node.scavenge.add(nodeIndex, cost);
    await api.node.scavenge.reward.addDT(nodeIndex, indices, weights, 1);
  } catch (e) {
    console.error(`Could not create Scavenge for node ${nodeIndex}`, e);
  }
}

// removes a Scavenge from a single node
export async function removeScavenge(api: AdminAPI, nodeIndex: number) {
  console.log(`Removing Scavenge for node ${nodeIndex}`);
  try {
    await api.node.scavenge.remove(nodeIndex);
  } catch (e) {
    console.error(`Could not remove Scavenge for node ${nodeIndex}`, e);
  }
}

// removes multiple Scavenges at once
export async function removeScavenges(api: AdminAPI, nodeIndices: number[]) {
  for (let i = 0; i < nodeIndices.length; i++) {
    const nodeIndex = nodeIndices[i];
    removeScavenge(api, nodeIndex);
  }
}

// removes and re-adds a Scavenge to a node entry
export async function reviseScavenge(api: AdminAPI, nodeEntry: any) {
  const nodeIndex = Number(nodeEntry['Index']);
  removeScavenge(api, nodeIndex);
  addScavengeDT(api, nodeEntry);
}
