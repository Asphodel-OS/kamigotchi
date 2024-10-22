import { HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { queryConditionsOf } from '../Conditional/queries';
import { BaseNode, Node, NullNode, Options, getBaseNode, getNode, getNodeEntity } from './types';

export const getBaseNodeByIndex = (
  world: World,
  components: Components,
  index: number
): BaseNode => {
  const entityIndex = getNodeEntity(world, index);
  if (!entityIndex) return NullNode;
  return getBaseNode(world, components, entityIndex);
};

export const getNodeByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Node => {
  const entityIndex = getNodeEntity(world, index);
  if (!entityIndex) return NullNode;
  return getNode(world, components, entityIndex, options);
};

export const getAllNodes = (world: World, components: Components, options?: Options): Node[] => {
  const { EntityType } = components;
  const entityIndices = Array.from(runQuery([HasValue(EntityType, { value: 'NODE' })]));

  return entityIndices.map((entityIndex) => {
    return getNode(world, components, entityIndex, options);
  });
};

export const getNodeRequirements = (
  world: World,
  components: Components,
  nodeIndex: number
): Condition[] => {
  return queryConditionsOf(world, components, 'node.requirement', nodeIndex, { for: true });
};
