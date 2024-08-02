import { World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryChildrenOfEntityIndex } from '../utils';
import { Condition, Options, getCondition } from './types';

export const queryConditionsOf = (
  world: World,
  components: Components,
  field: string,
  index: number,
  options?: Options
): Condition[] => {
  return queryChildrenOfEntityIndex(components, field, index).map((entityIndex) =>
    getCondition(world, components, entityIndex, options)
  );
};
