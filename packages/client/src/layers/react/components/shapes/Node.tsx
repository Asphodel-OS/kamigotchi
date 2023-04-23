import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Production, getProduction } from './Production';

// standardized shape of a Node Entity
export interface Node {
  id: EntityID;
  name: string;
  description: string;
  type: string;
  location: number;
  affinity?: string;
  productions?: Production[];
}

// optional data to populate for a Node Entity
export interface NodeOptions {
  productions?: boolean;
}

// get a Node from its EntityIndex
export const getNode = (
  layers: Layers,
  index: EntityIndex,
  options?: NodeOptions,
): Node => {
  const {
    network: {
      world,
      components: {
        Affinity,
        Description,
        IsProduction,
        Location,
        Name,
        NodeID,
        State,
        Type,
      },
    },
  } = layers;

  let node: Node = {
    id: world.entities[index],
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    location: getComponentValue(Location, index)?.value as number,
    type: getComponentValue(Type, index)?.value as string,
    affinity: getComponentValue(Affinity, index)?.value as string, // does this break if there's no affinity?
  }

  /////////////////
  // OPTIONAL DATA

  if (!options) return node;

  // populate Productions
  // NOTE: we can't rely on this function. see Account.tsx for failed attempts at debugging.
  if (options.productions) {
    const productionIndices = Array.from(
      runQuery([
        Has(IsProduction),
        HasValue(NodeID, { value: node.id, }),
        HasValue(State, { value: 'ACTIVE', }),
      ])
    );
    node.productions = productionIndices.map((index): Production => (
      getProduction(layers, index, { kami: true })
    ));
  }

  return node;
}