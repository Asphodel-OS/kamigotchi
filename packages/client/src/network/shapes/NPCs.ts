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
  entityIndex: EntityIndex;
  name: string;
  roomIndex: number;
}

export const NullNPC: NPC = {
  id: '0' as EntityID,
  index: 0,
  entityIndex: 0 as EntityIndex,
  name: '',
  roomIndex: 0,
};

// get an Merchant from its EntityIndex
export const getNPC = (world: World, components: Components, entityIndex: EntityIndex): NPC => {
  const { RoomIndex, NPCIndex, Name } = components;

  return {
    id: world.entities[entityIndex],
    index: getComponentValue(NPCIndex, entityIndex)?.value as number,
    entityIndex,
    name: getComponentValue(Name, entityIndex)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
  };
};

// the Merchant Index here is actually an NPCIndex
export const getNPCByIndex = (world: World, components: Components, index: number) => {
  const entityIndex = getNPCIndex(world, index);
  if (!entityIndex) return;
  return getNPC(world, components, entityIndex);
};

export const getAllNPCs = (world: World, components: Components) => {
  const { EntityType } = components;
  const entityIndices = Array.from(runQuery([HasValue(EntityType, { value: 'NPC' })]));
  return entityIndices.map((entityIndex) => getNPC(world, components, entityIndex));
};

const getNPCIndex = (world: World, npcIndex: number) => {
  return getEntityByHash(world, ['NPC', npcIndex], ['string', 'uint32']);
};
