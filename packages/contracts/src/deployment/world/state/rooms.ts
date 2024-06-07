import { AdminAPI } from '../admin';
import { getGoalID, readFile } from './utils';

export async function initRooms(api: AdminAPI) {
  const roomsCSV = await readFile('rooms/rooms.csv');
  for (let i = 0; i < roomsCSV.length; i++) {
    const room = roomsCSV[i];
    if (room['Enabled'] === 'true') {
      await initRoom(api, room);
    }
  }

  // load bearing test to initialse IndexSourceComponent - queries wont work without
  try {
    api.room.createGate(1, 1, 0, 0, 'CURR_MIN', 'KAMI');
  } catch (e) {
    console.log('gate creation failure:', e);
  }

  initGates(api);
}

export async function initRoomsByIndex(api: AdminAPI, indices: number[]) {
  const roomsCSV = await readFile('rooms/rooms.csv');
  for (let i = 0; i < roomsCSV.length; i++) {
    const room = roomsCSV[i];
    if (room['Enabled'] === 'true') {
      if (!indices.includes(Number(room['Index']))) continue;
      await initRoom(api, room);
    }
  }
}

export async function initGates(api: AdminAPI) {
  try {
    // creating goal gate from to the scrapyard
    await api.room.createGate(31, 0, 0, getGoalID(1), 'COMPLETE_COMP', 'BOOL_IS');
  } catch (e) {
    console.log('gate creation failure:', e);
  }
}

export async function deleteRooms(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    try {
      await api.room.delete(indices[i]);
    } catch {
      console.error('Could not delete room at roomIndex ' + indices[i]);
    }
  }
}

async function initRoom(api: AdminAPI, entry: any) {
  await api.room.create(
    Number(entry['X']),
    Number(entry['Y']),
    Number(entry['Z']),
    Number(entry['Index']),
    entry['Name'],
    entry['Description'],
    entry['Exits'].split(',').map((n: string) => Number(n.trim()))
  );
}
