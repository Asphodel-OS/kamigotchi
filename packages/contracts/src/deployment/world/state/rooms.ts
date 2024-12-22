import { AdminAPI } from '../admin';
import { getGoalID, readFile, toDelete, toRevise } from './utils';

// hardcoded gates - placeholder until notion is up
const gates = {
  1: (api: AdminAPI) => api.room.createGate(1, 1, 0, 0, 'CURR_MIN', 'KAMI', ''), // load bearing test to initialse IndexSourceComponent - queries wont work without
  12: (api: AdminAPI) =>
    api.room.createGate(12, 0, 0, getGoalID(2), 'COMPLETE_COMP', 'BOOL_IS', ''),
  31: (api: AdminAPI) =>
    api.room.createGate(31, 0, 0, getGoalID(1), 'COMPLETE_COMP', 'BOOL_IS', ''),
  50: (api: AdminAPI) =>
    api.room.createGate(50, 0, 0, getGoalID(3), 'COMPLETE_COMP', 'BOOL_IS', ''),
  53: (api: AdminAPI) =>
    api.room.createGate(53, 0, 0, getGoalID(4), 'COMPLETE_COMP', 'BOOL_IS', ''),
  55: (api: AdminAPI) =>
    api.room.createGate(55, 0, 0, getGoalID(6), 'COMPLETE_COMP', 'BOOL_IS', ''),
};

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
}

export async function deleteRooms(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const roomsCSV = await readFile('rooms/rooms.csv');
    for (let i = 0; i < roomsCSV.length; i++) {
      if (toDelete(roomsCSV[i])) indices.push(Number(roomsCSV[i]['Index']));
    }
  }

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
      if (toRevise(roomsCSV[i])) indices.push(Number(roomsCSV[i]['Index']));
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

  await createGate(api, Number(entry['Index']));
}

async function createGate(api: AdminAPI, roomIndex: number) {
  // create gate if there is a gate at index
  // uses placeholder gates above
  if (roomIndex in gates) {
    try {
      await gates[roomIndex as keyof typeof gates](api);
    } catch (e) {
      console.log('gate creation failure:', e);
    }
  }
}
