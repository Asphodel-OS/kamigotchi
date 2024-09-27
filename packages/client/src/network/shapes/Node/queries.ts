import { HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { queryConditionsOf } from '../Conditional/queries';
import { Node, NullNode, Options, getNode } from './types';

export const getNodeByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Node => {
  const { EntityType, NodeIndex } = components;
  const entityIndices = Array.from(
    runQuery([HasValue(EntityType, { value: 'NODE' }), HasValue(NodeIndex, { value: index })])
  );
  if (entityIndices.length === 0) return NullNode;

  return getNode(world, components, entityIndices[0], options);
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
