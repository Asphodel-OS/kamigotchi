import { HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { queryConditionsOf } from '../Conditional/queries';
import { queryByIndex } from './queries';
import { BaseNode, Node, NullNode, getBaseNode, getNode } from './types';

export const getBaseNodeByIndex = (
  world: World,
  components: Components,
  index: number
): BaseNode => {
  const entityIndex = queryByIndex(world, index);
  if (!entityIndex) return NullNode;
  return getBaseNode(world, components, entityIndex);
};

export const getNodeByIndex = (world: World, components: Components, index: number): Node => {
  const entityIndex = queryByIndex(world, index);
  if (!entityIndex) return NullNode;
  return getNode(world, components, entityIndex);
};

export const getAllNodes = (world: World, components: Components): Node[] => {
  const { EntityType } = components;
  const entityIndices = Array.from(runQuery([HasValue(EntityType, { value: 'NODE' })]));

  return entityIndices.map((entityIndex) => {
    return getNode(world, components, entityIndex);
  });
};

export const getNodeRequirements = (
  world: World,
  components: Components,
  nodeIndex: number
): Condition[] => {
  return queryConditionsOf(world, components, 'node.requirement', nodeIndex, { for: true });
};
