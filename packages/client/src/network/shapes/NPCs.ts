import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';

// standardized shape of a FE NPC Entity
export interface NPC {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  name: string;
  roomIndex: number;
}

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
  const { IsNPC, NPCIndex } = components;
  const entityIndex = Array.from(runQuery([Has(IsNPC), HasValue(NPCIndex, { value: index })]))[0];
  return getNPC(world, components, entityIndex);
};

export const getAllNPCs = (world: World, components: Components) => {
  const { IsNPC } = components;
  const entityIndices = Array.from(runQuery([Has(IsNPC)]));
  return entityIndices.map((entityIndex) => getNPC(world, components, entityIndex));
};
