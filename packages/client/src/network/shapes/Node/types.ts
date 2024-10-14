import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
import { Condition } from '../Conditional';
import { Item, getItemByIndex } from '../Item';
import { Kami, getKami } from '../Kami';
import { DetailedEntity } from '../utils';
import { getNodeRequirements } from './getters';

export interface BaseNode extends DetailedEntity {
  ObjectType: 'NODE';
  id: EntityID;
  entityIndex: EntityIndex;
  affinity: string;
  index: number;
}

// standardized shape of a Node Entity
export interface Node extends BaseNode {
  type: string;
  roomIndex: number;
  drops: Item[];
  requirements: Condition[];
  kamis: Kami[];
}

export interface Options {
  kamis?: boolean;
}

export const getBaseNode = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): BaseNode => {
  const { Affinity, Name, NodeIndex } = components;

  return {
    ObjectType: 'NODE',
    id: world.entities[entityIndex],
    entityIndex: entityIndex,
    affinity: getComponentValue(Affinity, entityIndex)?.value as string,
    index: getComponentValue(NodeIndex, entityIndex)?.value as number,
    name: getComponentValue(Name, entityIndex)?.value as string,
    image: '',
  };
};

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
    EntityType,
    RoomIndex,
    Name,
    SourceID,
    NodeIndex,
    HolderID,
    State,
    Type,
  } = components;

  const nodeIndex = getComponentValue(NodeIndex, entityIndex)?.value as number;

  let node: Node = {
    ...getBaseNode(world, components, entityIndex),
    type: getComponentValue(Type, entityIndex)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
    description: getComponentValue(Description, entityIndex)?.value as string,
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
        HasValue(EntityType, { value: 'HARVEST' }),
        HasValue(SourceID, { value: node.id }),
        HasValue(State, { value: 'ACTIVE' }),
      ])
    );

    // get list of kamis from list of productions
    for (let i = 0; i < productionEntityIndices.length; i++) {
      const kamiID = formatEntityID(
        getComponentValue(HolderID, productionEntityIndices[i])?.value ?? ''
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
  ObjectType: 'NODE',
  id: '0' as EntityID,
  index: 0,
  entityIndex: 0 as EntityIndex,
  type: '' as string,
  image: '',
  roomIndex: 0,
  name: 'Empty Node',
  description: 'There is no node in this room.',
  affinity: '' as string,
  drops: [],
  requirements: [],
  kamis: [],
};

/////////////////
// IDs

const IDStore = new Map<string, string>();

export const getNodeEntity = (world: World, nodeIndex: number): EntityIndex | undefined => {
  let id = '';
  const key = 'harvest' + nodeIndex.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(utils.solidityKeccak256(['string', 'uint32'], ['node', nodeIndex]));
    IDStore.set(key, id);
  }

  return world.entityToIndex.get(id as EntityID);
};
