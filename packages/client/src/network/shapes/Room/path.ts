import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getConfigArray } from 'app/cache/config';
import { getAdjacentRoomIndices, getRoomByIndex } from './functions';

export const findPathAndCost = (
  world: World,
  components: Components,
  fromIndex: number,
  toIndex: number
): { path: number[]; moves: number; staminaCost: number } => {
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
  const prev = new Map<number, number>();

  while (queue.length) {
    const curr = queue.shift()!;
    if (curr === toIndex) break;

    const currRoom = getRoomByIndex(world, components, curr);
    if (!currRoom?.location) continue;

    const neighbors = getAdjacentRoomIndices(components, currRoom.location);
    for (const n of neighbors) {
      if (visited.has(n)) continue;
      visited.add(n);
      prev.set(n, curr);
      queue.push(n);
    }
  }

  if (!visited.has(toIndex)) return [];

  const path: number[] = [];
  for (let at: number | undefined = toIndex; at !== undefined; at = prev.get(at)) {
    path.push(at);
    if (at === fromIndex) break;
  }
  path.reverse();
  return path;
}; 