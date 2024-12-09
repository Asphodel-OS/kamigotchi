import { getComponentValue, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { Condition } from '../Conditional';
import { getAdjacentRoomIndices } from './functions';
import { getGatesBetween } from './gate';
import { Room } from './types';

// TODO: consider how best to cache these room-to-room Exit results
export interface Exit {
  fromIndex: number;
  toIndex: number;
  gates: Condition[];
  blocked?: boolean;
}

// get the exit between two rooms along with its gates
const getExit = (
  world: World,
  components: Components,
  toIndex: number,
  fromIndex: number
): Exit => {
  return {
    toIndex,
    fromIndex,
    gates: getGatesBetween(world, components, toIndex, fromIndex),
  };
};

// get the exits for a room
export const getExitsFor = (world: World, components: Components, room: Room): Exit[] => {
  const { Exits } = components;
  const specialExits = (getComponentValue(Exits, room.entity)?.value as number[]) || [];
  const adjExits = getAdjacentRoomIndices(components, room.location);
  const rawExits = [...specialExits, ...adjExits];
  return rawExits.map((toIndex) => getExit(world, components, toIndex, room.index));
};
