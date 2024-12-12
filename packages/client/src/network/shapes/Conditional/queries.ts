import { EntityID, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryChildrenOf, queryChildrenOfEntityIndex } from '../utils';
import { Condition, Options, getCondition } from './types';

export function queryConditionsOf(
  world: World,
  components: Components,
  field: string,
  index: number,
  options?: Options
): Condition[] {
  return queryChildrenOfEntityIndex(components, field, index).map((entityIndex) =>
    getCondition(world, components, entityIndex, options)
  );
}

export function queryConditionsOfID(
  world: World,
  components: Components,
  ptrID: EntityID,
  options?: Options
): Condition[] {
  return queryChildrenOf(components, ptrID).map((entityIndex) =>
    getCondition(world, components, entityIndex, options)
  );
}
