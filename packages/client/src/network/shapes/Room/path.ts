import { World } from 'engine/recs';
import { Components } from 'network/';
import { getAdjacentRoomIndices, getRoomByIndex } from 'network/shapes/Room/functions';

export interface PathResult {
  path: number[];
  distance: number;
  reachable: boolean;
}

export const findPath = (
  world: World,
  components: Components,
  fromIndex: number,
  toIndex: number,
  canEnter?: (roomIndex: number) => boolean
): PathResult => {
  const fromRoom = getRoomByIndex(world, components, fromIndex);
  const toRoom = getRoomByIndex(world, components, toIndex);

  if (!fromRoom || !toRoom) {
    return { path: [], distance: -1, reachable: false };
  }

  if (fromIndex === toIndex) {
    return { path: [fromIndex], distance: 0, reachable: true };
  }

  const allow = canEnter ?? (() => true);

  const queue: number[] = [fromIndex];
  const visited = new Set<number>([fromIndex]);
  const prev = new Map<number, number>();
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const curr = queue[queueIndex++];
    if (curr === toIndex) break;

    const currRoom = getRoomByIndex(world, components, curr);
    if (!currRoom?.location) continue;

    const neighbors = getAdjacentRoomIndices(components, currRoom.location);
    for (const n of neighbors) {
      if (visited.has(n)) continue;
      if (!allow(n)) continue;
      visited.add(n);
      prev.set(n, curr);
      queue.push(n);
    }
  }

  if (!visited.has(toIndex)) {
    return { path: [], distance: -1, reachable: false };
  }

  // reconstruct path
  const path: number[] = [];
  for (let at: number | undefined = toIndex; at !== undefined; at = prev.get(at)) {
    path.push(at);
    if (at === fromIndex) break;
  }
  path.reverse();

  return {
    path,
    distance: path.length - 1,
    reachable: true,
  };
};

export const calculatePathStaminaCost = (
  distance: number,
  staminaCostPerMove: number = 5
): number => {
  return distance * staminaCostPerMove;
};

