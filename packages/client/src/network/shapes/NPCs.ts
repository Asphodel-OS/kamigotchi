import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { getEntityByHash } from './utils';

// standardized shape of a FE NPC Entity
export interface NPC {
  id: EntityID;
  index: number;
  entity: EntityIndex;
  name: string;
  roomIndex: number;
}

export const NullNPC: NPC = {
  id: '0' as EntityID,
  index: 0,
  entity: 0 as EntityIndex,
  name: '',
  roomIndex: 0,
};

// get an Merchant from its EntityIndex
export const getNPC = (world: World, components: Components, entity: EntityIndex): NPC => {
  const { RoomIndex, NPCIndex, Name } = components;

  return {
    id: world.entities[entity],
    index: getComponentValue(NPCIndex, entity)?.value as number,
    entity,
    name: getComponentValue(Name, entity)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entity)?.value as number,
  };
};

// the Merchant Index here is actually an NPCIndex
export const getNPCByIndex = (world: World, components: Components, index: number) => {
  const entity = getNPCIndex(world, index);
  if (!entity) return;
  return getNPC(world, components, entity);
};

export const getAllNPCs = (world: World, components: Components) => {
  const { EntityType } = components;
  const entityIndices = Array.from(runQuery([HasValue(EntityType, { value: 'NPC' })]));
  return entityIndices.map((entity) => getNPC(world, components, entity));
};

const getNPCIndex = (world: World, npcIndex: number) => {
  return getEntityByHash(world, ['NPC', npcIndex], ['string', 'uint32']);
};
