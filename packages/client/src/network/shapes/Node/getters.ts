import { HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { getConditionsOf } from '../Conditional/queries';
import { NullNode } from './constants';
import { queryByIndex } from './queries';
import { BaseNode, Node, getBaseNode, getNode } from './types';

export const getBaseByIndex = (world: World, components: Components, index: number): BaseNode => {
  const entity = queryByIndex(world, index);
  if (!entity) return NullNode;
  return getBaseNode(world, components, entity);
};

export const getByIndex = (world: World, components: Components, index: number): Node => {
  const entity = queryByIndex(world, index);
  if (!entity) return NullNode;
  return getNode(world, components, entity);
};

export const getAll = (world: World, components: Components): Node[] => {
  const { EntityType } = components;
  const entityIndices = Array.from(runQuery([HasValue(EntityType, { value: 'NODE' })]));

  return entityIndices.map((entity) => {
    return getNode(world, components, entity);
  });
};

export const getRequirements = (
  world: World,
  components: Components,
  nodeIndex: number
): Condition[] => {
  return getConditionsOf(world, components, 'node.requirement', nodeIndex, { for: true });
};
