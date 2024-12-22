import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { Components } from 'network/';
import { getFor } from '../utils/component';

/**
 * A client equivalent to Conditionals. For supporting other shapes
 */

export interface Condition {
  id: EntityID;
  logic: string;
  target: Target;
  status?: Status;
  for?: string;
}

// the Target of a Condition (eg Objective, Requirement, Reward)
export interface Target {
  type: string;
  index?: number;
  value?: number;
}

export interface Status {
  target?: number;
  current?: number;
  completable: boolean;
}

export interface Options {
  for?: boolean;
}

export type HANDLER = 'CURR' | 'INC' | 'DEC' | 'BOOL';
export type OPERATOR = 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT';

export const getCondition = (
  world: World,
  components: Components,
  entity: EntityIndex | undefined,
  options?: Options
): Condition => {
  const { Value, Index, LogicType, Type } = components;

  if (!entity) return { id: '0' as EntityID, logic: '', target: { type: '' }, status: undefined };

  let result: Condition = {
    id: world.entities[entity],
    logic: getComponentValue(LogicType, entity)?.value || ('' as string),
    target: {
      type: getComponentValue(Type, entity)?.value || ('' as string),
      index: getComponentValue(Index, entity)?.value,
      value: getComponentValue(Value, entity)?.value,
    },
  };

  if (options?.for) result.for = getFor(components, entity);

  return result;
};
