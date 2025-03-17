import { AdminAPI } from '../../api';
import { textToNumberArray } from '../utils';

// creates both scavBar and its reward at once. assumes each scav bar only has one reward, a DT
export async function addScavenge(api: AdminAPI, nodeEntry: any) {
  const nodeIndex = Number(nodeEntry['Index']);
  const cost = Number(nodeEntry['Scav Cost']);

  return;
  await api.node.add.scav(nodeIndex, cost);
  await api.node.add.scavReward.droptable(
    nodeIndex,
    textToNumberArray(nodeEntry['Item Drop Indices']),
    textToNumberArray(nodeEntry['Item Drop Weights']),
    1
  );
}
