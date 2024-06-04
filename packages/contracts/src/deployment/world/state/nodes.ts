import { AdminAPI } from '../admin';
import { readFile } from './utils';

export async function initNodes(api: AdminAPI) {
  const nodesCSV = await readFile('nodes/Nodes.csv');

  for (let i = 0; i < nodesCSV.length; i++) {
    const node = nodesCSV[i];
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
    try {
      await api.node.delete(indices[i]);
    } catch {
      console.error('Could not delete node ' + indices[i]);
    }
  }
}
