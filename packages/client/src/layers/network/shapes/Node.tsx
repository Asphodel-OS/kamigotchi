import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'layers/network';
import { Kami, getKami } from './Kami';

// standardized shape of a Node Entity
export interface Node {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  type: string;
  roomIndex: number;
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
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: Options
): Node => {
  const {
    Affinity,
    Description,
    IsProduction,
    RoomIndex,
    Name,
    NodeID,
    NodeIndex,
    PetID,
    State,
    Type,
  } = components;

  let node: Node = {
    id: world.entities[entityIndex],
    index: getComponentValue(NodeIndex, entityIndex)?.value as number,
    entityIndex,
    type: getComponentValue(Type, entityIndex)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
    name: getComponentValue(Name, entityIndex)?.value as string,
    description: getComponentValue(Description, entityIndex)?.value as string,
    affinity: getComponentValue(Affinity, entityIndex)?.value as string, // does this break if there's no affinity?
  };

  // (option) get the kamis on this node
  if (options?.kamis) {
    let kamis: Kami[] = [];
    let kamisMine: Kami[] = [];
    let kamisOthers: Kami[] = [];

    // get list of productions on this node
    const productionEntityIndices = Array.from(
      runQuery([
        Has(IsProduction),
        HasValue(NodeID, { value: node.id }),
        HasValue(State, { value: 'ACTIVE' }),
      ])
    );

    // get list of kamis from list of productions
    for (let i = 0; i < productionEntityIndices.length; i++) {
      const kamiID = getComponentValue(PetID, productionEntityIndices[i])?.value as EntityID;
      const kamiEntityIndex = world.entityToIndex.get(kamiID);
      if (kamiEntityIndex) {
        kamis.push(
          getKami(world, components, kamiEntityIndex, {
            account: true,
            production: true,
            traits: true,
          })
        );
      }
    }

    // split node kamis between mine and others
    if (kamis && options.accountID) {
      kamisMine = kamis.filter((kami) => {
        return kami.account?.id === options.accountID;
      });
      kamisOthers = kamis.filter((kami) => {
        return kami.account?.id !== options.accountID;
      });
    } else {
      kamisOthers = kamis;
    }

    node.kamis = {
      allies: kamisMine,
      enemies: kamisOthers,
    };
  }

  return node;
};

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
