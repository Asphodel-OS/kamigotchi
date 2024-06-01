import nodesCSV from 'assets/data/nodes/nodes.csv';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initNodes(api: AdminAPI) {
  for (let i = 0; i < nodesCSV.length; i++) {
    const node = nodesCSV[i];
    await sleepIf();
    try {
      await api.node.create(
        Number(node['Index']),
        node['Type'],
        Number(node['RoomIndex']),
        node['Name'],
        node['Description'],
        node['Affinity']
      );
    } catch {}
  }
}

export async function deleteNodes(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await sleepIf();
    try {
      await api.node.delete(indices[i]);
    } catch {
      console.error('Could not delete node ' + indices[i]);
    }
  }
}
