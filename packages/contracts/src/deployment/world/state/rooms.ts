import { AdminAPI } from '../admin';
import { getGoalID, readFile } from './utils';

export async function initRooms(api: AdminAPI, overrideIndices?: number[]) {
  const roomsCSV = await readFile('rooms/rooms.csv');
  for (let i = 0; i < roomsCSV.length; i++) {
    const room = roomsCSV[i];

    // skip if indices are overridden and room isn't included
    if (overrideIndices && !overrideIndices.includes(Number(room['Index']))) continue;

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

export async function reviseRooms(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const roomsCSV = await readFile('rooms/rooms.csv');
    for (let i = 0; i < roomsCSV.length; i++) {
      if (roomsCSV[i]['Status'] === 'Revise Deployment') indices.push(Number(roomsCSV[i]['Index']));
    }
  }

  await deleteRooms(api, indices);
  await initRooms(api, indices);
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
