import { AdminAPI } from '../admin';
import { readFile } from './utils';

export async function initNodes(api: AdminAPI) {
  // nodes data are stored in rooms csv
  const roomsCSV = await readFile('rooms/rooms.csv');

  for (let i = 0; i < roomsCSV.length; i++) {
    const entry = roomsCSV[i];
    if (entry['Enabled'] !== 'true') continue;
    if (entry['Node'] === '' || entry['Node'] === 'NONE') continue;
    try {
      await initNode(api, entry);
    } catch {
      console.error('Could not create node', entry['Index']);
    }
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
