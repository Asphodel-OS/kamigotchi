import roomsCSV from 'assets/data/rooms/rooms.csv';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initNodes(api: AdminAPI) {
  // nodes data are stored in rooms csv
  for (let i = 0; i < roomsCSV.length; i++) {
    const entry = roomsCSV[i];
    await sleepIf();
    if (entry['Enabled'] !== 'true') continue;
    if (entry['Node'] === '' || entry['Node'] === 'NONE') continue;
    try {
      await api.node.create(
        Number(entry['Index']),
        'HARVEST', // all nodes are harvesting nodes rn
        Number(entry['Index']),
        entry['Name'],
        entry['Description'],
        entry['Affinity']
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
