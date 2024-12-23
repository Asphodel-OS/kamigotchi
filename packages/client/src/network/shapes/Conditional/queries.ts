import { EntityID, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { genID, queryChildrenOf } from '../utils';
import { Condition, Options, getCondition } from './types';

export function getConditionsOf(
  world: World,
  comps: Components,
  field: string,
  index: number,
  options?: Options
): Condition[] {
  const id = genID(field, index);
  const childEntities = queryChildrenOf(comps, id);
  return childEntities.map((entity) => getCondition(world, comps, entity, options));
}

export function getConditionsOfID(
  world: World,
  comps: Components,
  ptrID: EntityID,
  options?: Options
): Condition[] {
  const childEntities = queryChildrenOf(comps, ptrID);
  return childEntities.map((entity) => getCondition(world, comps, entity, options));
}
