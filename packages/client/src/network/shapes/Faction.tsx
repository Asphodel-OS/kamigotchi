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

import PlaceholderIcon from 'assets/images/icons/placeholder.png';
import { Components } from 'network/';
import { DetailedEntity } from './utils/EntityTypes';

// standardized Object shape of a Score Entity
export interface Faction extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
}

export interface Reputation extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  faction: Faction;
  value?: number;
}

export const getFactionByIndex = (world: World, components: Components, index: number): Faction => {
  const entityIndex = getEntityIndex(world, index);
  if (!entityIndex) throw new Error('getFactionByIndex: index not found');

  return getFaction(world, components, entityIndex);
};

// get a DetailedEntity entity of a Faction's reputation, similar to an item
export const getReputationItem = (
  world: World,
  components: Components,
  factionIndex: number
): Reputation => {
  const faction = getFactionByIndex(world, components, factionIndex);

  return {
    ObjectType: 'REPUTATION',
    id: '' as EntityID,
    entityIndex: 0 as EntityIndex,
    faction: faction,
    name: 'REPUTATION',
    description: 'Your relationship with the Kamigotchi Tourism Agency.',
    image: PlaceholderIcon, // placeholder - no reputation image yet
  };
};

// get a DetailedEntity entity of a Faction's reputation, similar to an inventory
export const getReputation = (
  world: World,
  components: Components,
  holderID: EntityID,
  factionIndex: number
): Reputation => {
  const index = getRepEntityIndex(world, holderID, factionIndex);

  return {
    ...getReputationItem(world, components, factionIndex),
    id: index ? world.entities[index] : ('' as EntityID),
    entityIndex: index ?? (0 as EntityIndex),
    value: getReputationValue(world, components, holderID, factionIndex),
  };
};

export const getReputationValue = (
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
