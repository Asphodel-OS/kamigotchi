import { Has, HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { queryConditionsOf } from '../Conditional/queries';
import { Node, Options, getNode } from './types';

export const getNodeByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Node | undefined => {
  const { IsNode, NodeIndex } = components;
  const entityIndices = Array.from(runQuery([Has(IsNode), HasValue(NodeIndex, { value: index })]));
  if (entityIndices.length === 0) return undefined;

  return getNode(world, components, entityIndices[0], options);
};

export const getAllNodes = (world: World, components: Components, options?: Options): Node[] => {
  const { IsNode } = components;
  const entityIndices = Array.from(runQuery([Has(IsNode)]));

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
