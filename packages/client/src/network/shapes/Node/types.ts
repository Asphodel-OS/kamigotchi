import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { Item, getItemByIndex } from '../Item';
import { ScavBar, getScavenge, queryScavRegistry } from '../Scavenge';
import { DetailedEntity } from '../utils';
import { NullNode } from './constants';
import { getRequirements } from './getters';

export interface BaseNode extends DetailedEntity {
  ObjectType: 'NODE';
  id: EntityID;
  entity: EntityIndex;
  affinity: string;
  index: number;
}

// standardized shape of a Node Entity
export interface Node extends BaseNode {
  type: string;
  roomIndex: number;
  drops: Item[];
  requirements: Condition[];
  scavenge: ScavBar;
}

export const getBaseNode = (
  world: World,
  components: Components,
  entity: EntityIndex
): BaseNode => {
  const { Affinity, Name, NodeIndex } = components;

  return {
    ObjectType: 'NODE',
    id: world.entities[entity],
    entity,
    affinity: getComponentValue(Affinity, entity)?.value as string,
    index: getComponentValue(NodeIndex, entity)?.value as number,
    name: getComponentValue(Name, entity)?.value as string,
    image: '',
  };
};

// get a Node from its EntityIndex
export const getNode = (world: World, components: Components, entity: EntityIndex): Node => {
  const { Description, ItemIndex, RoomIndex, NodeIndex, Type } = components;
  const nodeIndex = getComponentValue(NodeIndex, entity)?.value as number;
  const scavEntity = queryScavRegistry(world, 'NODE', nodeIndex)!;
  if (!nodeIndex) {
    console.warn(`Index not found for Node Entity ${entity}`);
    return NullNode;
  }

  let node: Node = {
    ...getBaseNode(world, components, entity),
    type: getComponentValue(Type, entity)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entity)?.value as number,
    description: getComponentValue(Description, entity)?.value as string,
    drops: [
      getItemByIndex(world, components, getComponentValue(ItemIndex, entity)?.value as number),
    ],
    requirements: getRequirements(world, components, nodeIndex),
    scavenge: getScavenge(world, components, scavEntity),
  };

  return node;
};
