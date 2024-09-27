import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Condition } from '../Conditional';
import { Item, getItemByIndex } from '../Item';
import { Kami, getKami } from '../Kami';
import { getNodeRequirements } from './queries';

// standardized shape of a Node Entity
export interface Node {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  type: string;
  roomIndex: number;
  name: string;
  description: string;
  drops: Item[];
  requirements: Condition[];
  affinity: string;
  kamis: Kami[];
}

export interface Options {
  kamis?: boolean;
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
    KamiID,
    State,
    Type,
  } = components;

  const nodeIndex = getComponentValue(NodeIndex, entityIndex)?.value as number;

  let node: Node = {
    id: world.entities[entityIndex],
    index: nodeIndex,
    entityIndex,
    type: getComponentValue(Type, entityIndex)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
    name: getComponentValue(Name, entityIndex)?.value as string,
    description: getComponentValue(Description, entityIndex)?.value as string,
    affinity: getComponentValue(Affinity, entityIndex)?.value as string, // does this break if there's no affinity?
    drops: [getItemByIndex(world, components, 1)],
    requirements: getNodeRequirements(world, components, nodeIndex),
    kamis: [],
  };

  // (option) get the kamis on this node
  if (options?.kamis) {
    let kamis: Kami[] = [];

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
      const kamiID = formatEntityID(
        getComponentValue(KamiID, productionEntityIndices[i])?.value ?? ''
      );
      const kamiEntityIndex = world.entityToIndex.get(kamiID);
      if (kamiEntityIndex) {
        kamis.push(
          getKami(world, components, kamiEntityIndex, {
            production: true,
            traits: true,
          })
        );
      }
    }
    node.kamis = kamis;
  }

  return node;
};

export const NullNode: Node = {
  id: '0' as EntityID,
  index: 0,
  entityIndex: 0 as EntityIndex,
  type: '' as string,
  roomIndex: 0,
  name: 'Empty Node',
  description: 'There is no node in this room.',
  affinity: '' as string,
  drops: [],
  requirements: [],
  kamis: [],
};
