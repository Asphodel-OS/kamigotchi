import {
  EntityID,
  EntityIndex,
  Has,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { utils } from 'ethers';

import { Components } from 'network/';
import { DetailedEntity } from './utils/EntityTypes';

// standardized Object shape of a Score Entity
export interface Faction extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  name: string;
  description: string;
  image: string;
}

export const getFactionByIndex = (world: World, components: Components, index: number): Faction => {
  const entityIndex = getEntityIndex(world, index);
  if (!entityIndex) throw new Error('getFactionByIndex: index not found');

  return getFaction(world, components, entityIndex);
};

export const getReputation = (
  world: World,
  components: Components,
  holderID: EntityID,
  factionIndex: number
): number => {
  const { Value } = components;

  const entityIndex = getRepEntityIndex(world, holderID, factionIndex);
  if (!entityIndex) return 0;

  return (getComponentValue(Value, entityIndex)?.value as number) * 1;
};

export const getAllFactions = (world: World, components: Components): Faction[] => {
  const { FactionIndex, IsRegistry } = components;

  const toQuery: QueryFragment[] = [Has(FactionIndex), Has(IsRegistry)];

  // retrieve the relevant entities and their shapes
  const entityIndices = Array.from(runQuery(toQuery));
  return entityIndices.map((index) => getFaction(world, components, index));
};

// get a Score object from its EnityIndex
export const getFaction = (world: World, components: Components, index: EntityIndex): Faction => {
  const { FactionIndex, Name, Description, MediaURI } = components;

  return {
    ObjectType: 'FACTION',
    id: world.entities[index],
    entityIndex: index,
    index: getComponentValue(FactionIndex, index)?.value as number,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    image: getComponentValue(MediaURI, index)?.value as string,
  };
};

///////////////
// UTILS

const getEntityIndex = (world: any, index: number): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(['string', 'uint32'], ['faction', index]);
  return world.entityToIndex.get(id as EntityID);
};

const getRepEntityIndex = (
  world: any,
  holderID: EntityID | undefined,
  index: number
): EntityIndex | undefined => {
  if (!holderID) return;
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'uint32'],
    ['faction.reputation', holderID, index]
  );
  return world.entityToIndex.get(id as EntityID);
};
