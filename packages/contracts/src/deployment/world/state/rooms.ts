import roomsCSV from 'assets/data/rooms/rooms.csv';
import { getGoalID } from 'layers/network/shapes/Goal';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initRooms(api: AdminAPI) {
  for (let i = 0; i < roomsCSV.length; i++) {
    const room = roomsCSV[i];
    if (room['Enabled'] === 'true') {
      // console.log(room);
      await sleepIf();
      await api.room.create(
        {
          x: Number(room['X']),
          y: Number(room['Y']),
          z: Number(room['Z']),
        },
        Number(room['Index']),
        room['Name'],
        room['Description'],
        room['Exits'].split(',').map((n: string) => Number(n.trim()))
      );
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

export async function initRoom(api: AdminAPI, roomIndex: number) {
  const room = roomsCSV.find((r: any) => Number(r['Index']) === roomIndex);
  if (!room) return;

  await api.room.create(
    {
      x: Number(room['X']),
      y: Number(room['Y']),
      z: Number(room['Z']),
    },
    Number(room['Index']),
    room['Name'],
    room['Description'],
    room['Exits'].split(',').map((n: string) => Number(n.trim()))
  );
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
