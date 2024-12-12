import { EntityID, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { getValue } from '../utils/component';
import { queryInstance } from './queries';

// get the number of points in a scavenge instance
export const getPoints = (
  world: World,
  components: Components,
  type: string,
  scavIndex: number,
  holderID: EntityID
): number => {
  if (!scavIndex) return 0;
  const entity = queryInstance(world, type, scavIndex, holderID);
  return entity ? getValue(components, entity) : 0;
};

export const calcClaimable = (cost: number, points: number): number => {
  return Math.floor(points / cost);
};
