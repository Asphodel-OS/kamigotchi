import { EntityIndex, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition, genConditionPtr, getCondition } from './types';

export const queryConditionsOfEntityIndex = (
  components: Components,
  field: string,
  index: number
): EntityIndex[] => {
  const { PointerID } = components;
  const toQuery: QueryFragment[] = [
    HasValue(PointerID, {
      value: genConditionPtr(field, index),
    }),
  ];
  return Array.from(runQuery(toQuery));
};

export const queryConditionsOf = (
  world: World,
  components: Components,
  field: string,
  index: number
): Condition[] => {
  return queryConditionsOfEntityIndex(components, field, index).map((index) =>
    getCondition(world, components, index)
  );
};
