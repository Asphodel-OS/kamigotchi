import { EntityID, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryChildrenOf, queryChildrenOfIndex } from '../utils';
import { Condition, Options, getCondition } from './types';

export function queryConditionsOf(
  world: World,
  components: Components,
  type: string,
  index: number,
  options?: Options
): Condition[] {
  const childEntities = queryChildrenOfIndex(components, type, index);
  return childEntities.map((entityIndex) => getCondition(world, components, entityIndex, options));
}

export function queryConditionsOfID(
  world: World,
  components: Components,
  ptrID: EntityID,
  options?: Options
): Condition[] {
  const childEntities = queryChildrenOf(components, ptrID);
  return childEntities.map((entityIndex) => getCondition(world, components, entityIndex, options));
}
