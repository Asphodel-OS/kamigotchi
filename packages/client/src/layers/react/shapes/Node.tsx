import {
  EntityIndex,
  EntityID,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, getKami } from './Kami';
import { numberToHex } from 'utils/hex';

// standardized shape of a Node Entity
export interface Node {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  type: string;
  location: number;
  name: string;
  description: string;
  affinity?: string;
  kamis?: NodeKamis;
}

export interface NodeKamis {
  allies: Kami[];
  enemies: Kami[];
}

interface Options {
  kamis?: boolean;
  accountID?: EntityID;
}

// get a Node from its EntityIndex
export const getNode = (
  layers: Layers,
  entityIndex: EntityIndex,
  options?: Options,
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
        NodeIndex,
        PetID,
        State,
        Type,
      },
    },
  } = layers;

  let node: Node = {
    id: world.entities[entityIndex],
    index: getComponentValue(NodeIndex, entityIndex)?.value as number * 1,
    entityIndex,
    type: getComponentValue(Type, entityIndex)?.value as string,
    location: getComponentValue(Location, entityIndex)?.value as number * 1,
    name: getComponentValue(Name, entityIndex)?.value as string,
    description: getComponentValue(Description, entityIndex)?.value as string,
    affinity: getComponentValue(Affinity, entityIndex)?.value as string, // does this break if there's no affinity?
  }

  // (option) get the kamis on this node
  if (options?.kamis) {
    // get the productions on this node
    let nodeKamis: Kami[] = [];
    let nodeKamisMine: Kami[] = [];
    let nodeKamisOthers: Kami[] = [];
    if (node) {
      // populate the account Kamis
      const nodeProductionIndices = Array.from(
        runQuery([
          Has(IsProduction),
          HasValue(NodeID, { value: node.id }),
          HasValue(State, { value: 'ACTIVE' }),
        ])
      );

      for (let i = 0; i < nodeProductionIndices.length; i++) {
        const productionIndex = nodeProductionIndices[i];

        // kami:production is 1:1, so we're guaranteed to find one here
        const kamiID = getComponentValue(PetID, productionIndex)?.value as EntityID;
        const kamiIndex = world.entityToIndex.get(kamiID);
        nodeKamis.push(getKami(
          layers,
          kamiIndex!,
          { account: true, production: true, traits: true }
        ));
      }

      // split node kamis between mine and others
      if (nodeKamis && options.accountID) {
        nodeKamisMine = nodeKamis.filter((kami) => {
          return kami.account!.id === options.accountID;
        });
        nodeKamisOthers = nodeKamis.filter((kami) => {
          return kami.account!.id !== options.accountID;
        });
      } else {
        nodeKamisOthers = nodeKamis;
      }

      node.kamis = {
        allies: nodeKamisMine,
        enemies: nodeKamisOthers,
      };
    }
  }

  return node;
}

export const getNodeByIndex = (
  layers: Layers,
  index: number,
  options?: Options,
): Node => {
  const { network: { components: { IsNode, NodeIndex } } } = layers;
  const entityIndex = Array.from(
    runQuery([
      Has(IsNode),
      HasValue(NodeIndex, { value: numberToHex(index) }),
    ])
  )[0];

  return getNode(layers, entityIndex, options);
}

