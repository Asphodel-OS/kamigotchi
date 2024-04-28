import { Has, HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { Node, Options, getNode } from './types';

export const getNodeByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Node => {
  const { IsNode, NodeIndex } = components;
  const entityIndex = Array.from(runQuery([Has(IsNode), HasValue(NodeIndex, { value: index })]))[0];

  return getNode(world, components, entityIndex, options);
};

export const getAllNodes = (world: World, components: Components, options?: Options): Node[] => {
  const { IsNode } = components;
  const entityIndices = Array.from(runQuery([Has(IsNode)]));

  return entityIndices.map((entityIndex) => {
    return getNode(world, components, entityIndex, options);
  });
};
