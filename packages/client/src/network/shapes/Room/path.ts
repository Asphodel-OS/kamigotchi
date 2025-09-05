import { World } from '@mud-classic/recs';

import { getConfigArray } from 'app/cache/config';
import { Components } from 'network/components';
import { getRoomByIndex, getAdjacentRoomIndices } from './functions';


export interface TravelPath {
  path: number[];
  moves: number;
  staminaCost: number;
}

export const findPathAndCost = (
  world: World,
  components: Components,
  fromIndex: number,
  toIndex: number
): TravelPath => {
  const path = bfs(world, components, fromIndex, toIndex);
  const moves = Math.max(0, path.length - 1);
  const config = getConfigArray(world, components, 'ACCOUNT_STAMINA');
  const parsed = Number(config?.[2]);
  const moveCost = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const staminaCost = moves * moveCost;
  return { path, moves, staminaCost };
};

const bfs = (
  world: World,
  components: Components,
  fromIndex: number,
  toIndex: number
): number[] => {
  const fromRoom = getRoomByIndex(world, components, fromIndex);
  const toRoom = getRoomByIndex(world, components, toIndex);
  if (!fromRoom || !toRoom) return [];
  if (fromIndex === toIndex) return [fromIndex];

  const queue: number[] = [fromIndex];
  const visited = new Set<number>([fromIndex]);
  const parent = new Map<number, number>();

  // TODO: Consider gating logic for blocked rooms (Gates) in neighbor expansion.
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currRoom = getRoomByIndex(world, components, curr);
    if (!currRoom?.location) continue;
    const neighbors = getAdjacentRoomIndices(components, currRoom.location);
    for (const n of neighbors) {
      if (visited.has(n)) continue;
      visited.add(n);
      parent.set(n, curr);
      if (n === toIndex) {
        const path: number[] = [toIndex];
        let p = curr;
        while (p !== fromIndex) {
          path.push(p);
          p = parent.get(p)!;
        }
        path.push(fromIndex);
        path.reverse();
        return path;
      }
      queue.push(n);
    }
  }

  return [];
}; 