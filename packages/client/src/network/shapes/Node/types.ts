import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { Item, getItemByIndex } from '../Item';
import { Kami } from '../Kami';
import { DetailedEntity } from '../utils';
import { getRequirements } from './getters';

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
export const getNode = (world: World, components: Components, entityIndex: EntityIndex): Node => {
  const { Description, RoomIndex, NodeIndex, Type } = components;

  const nodeIndex = getComponentValue(NodeIndex, entityIndex)?.value as number;
  let node: Node = {
    ...getBaseNode(world, components, entityIndex),
    type: getComponentValue(Type, entityIndex)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
    description: getComponentValue(Description, entityIndex)?.value as string,
    drops: [getItemByIndex(world, components, 1)],
    requirements: getRequirements(world, components, nodeIndex),
    kamis: [],
  };

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
