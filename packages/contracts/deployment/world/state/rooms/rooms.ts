import { AdminAPI } from '../../api';
import { getSheet, stringToNumberArray, toDelete, toRevise } from '../utils';
import { createGates } from './gates';

export async function initRooms(api: AdminAPI, indices?: number[], all?: boolean) {
  const roomsCSV = await getSheet('rooms', 'rooms');
  if (!roomsCSV) return console.log('No rooms/rooms.csv found');
  console.log('\n==INITIALIZING ROOMS==');

  // Status-based processing
  // TODO: status based processing based on environment
  // - Local: Ready, To Deploy, In Game
  // - Test: Ready, To Deploy
  // - Prod: To Deploy
  let validStatuses = ['To Deploy'];
  if (all || indices !== undefined) {
    validStatuses.push('In Game');
    validStatuses.push('Ready');
  }

  const liveRooms = roomsCSV.map((room: any) => Number(room['Index'])); // get live indices
  for (let i = 0; i < roomsCSV.length; i++) {
    const room = roomsCSV[i];
    const index = Number(room['Index']);
    // skip if indices are overridden and room isn't included
    if (indices && !indices.includes(index)) continue;

    const status = room['Status'];
    if (validStatuses.includes(status)) await initRoom(api, room, liveRooms);
  }
}

// NOTE: standardize statuses on data sheets and deprecate toDelete() pattern
export async function deleteRooms(api: AdminAPI, overrideIndices?: number[]) {
  const roomsCSV = await getSheet('rooms', 'rooms');
  if (!roomsCSV) return console.log('No rooms/rooms.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < roomsCSV.length; i++) {
      const index = Number(roomsCSV[i]['Index']);

      if (toDelete(roomsCSV[i])) indices.push(index);
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
  const roomsCSV = await getSheet('rooms', 'rooms');
  if (!roomsCSV) return console.log('No rooms/rooms.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < roomsCSV.length; i++) {
      if (toRevise(roomsCSV[i])) indices.push(Number(roomsCSV[i]['Index']));
    }
  }

  await deleteRooms(api, indices);
  await initRooms(api, indices);
}

async function initRoom(api: AdminAPI, entry: any, liveRooms: number[]) {
  const index = Number(entry['Index']);
  const name = entry['Name'];
  const description = entry['Description'];
  const x = Number(entry['X']);
  const y = Number(entry['Y']);
  const z = Number(entry['Z']);
  const exits = parseExits(entry, liveRooms);
  const exitsStr = exits.length > 0 ? `with exit(s) ${exits.join(', ')}` : '';

  let success = true;
  try {
    console.log(`Creating Room: (${index}) ${name} `, `\n  at (${x}, ${y}, ${z}) ${exitsStr}`);
    await api.room.create(x, y, z, index, name, description, exits);
  } catch (e) {
    success = false;
    console.error(`Could not create room ${index}`, e);
  } finally {
    if (success) await createGates(api, index);
  }
}

/////////////////
// UTILS

// filter out exits to undeployed rooms
function parseExits(entry: any, liveRooms: number[]) {
  const raw = stringToNumberArray(entry['Exits']);
  const exits: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (liveRooms.includes(raw[i])) exits.push(raw[i]);
  }
  return exits;
}
