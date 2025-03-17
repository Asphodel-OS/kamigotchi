import { AdminAPI } from '../../api';
import { getSheet, textToNumberArray } from '../utils';

// creates both scavBar and its reward at once. assumes each scav bar only has one reward, a DT
export async function addScavenge(api: AdminAPI, nodeEntry: any) {
  const scavengesCSV = await getSheet('rooms', 'droptables');
  if (!scavengesCSV) return console.log('No rooms/droptables.csv found');

  const nodeIndex = Number(nodeEntry['Index']);
  const cost = Number(nodeEntry['Scav Cost']);
  const scavKey = nodeEntry['Drops'];

  const scavEntry = scavengesCSV.find((row: any) => row['Name'] === scavKey);
  if (!scavEntry) return console.error(`Error: Could not find scavenge for node ${nodeIndex}`);
  const indices = textToNumberArray(scavEntry['Indices']);
  const weights = textToNumberArray(scavEntry['Tiers']);

  try {
    console.log(
      `  adding scavenge for node ${nodeIndex} with cost ${cost}`,
      `\n  drops: (${indices.join(', ')}) with weights: (${weights.join(', ')})`
    );
    await api.node.add.scav(nodeIndex, cost);
    await api.node.add.scavReward.droptable(nodeIndex, indices, weights, 1);
  } catch (e) {
    console.error(`Could not create scavenge for node ${nodeIndex}`, e);
  }
}
