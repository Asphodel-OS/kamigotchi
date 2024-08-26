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

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { DetailedEntity } from './utils';
import { getFactionImage } from './utils/images';

// standardized Object shape of a Score Entity
export interface Faction extends DetailedEntity {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
}

///////////////
// GETTERS

export const getFactionByIndex = (world: World, components: Components, index: number): Faction => {
  const entityIndex = getEntityIndex(world, index);
  if (!entityIndex) throw new Error('getFactionByIndex: index not found');

  return getFaction(world, components, entityIndex, index);
};

// reputation details override for faction shape (diff name style)
export const getReputationDetailsByIndex = (
  world: World,
  components: Components,
  index: number
): Faction => {
  const entityIndex = getEntityIndex(world, index);
  if (!entityIndex) throw new Error('getFactionRepByIndex: index not found');

  return getReputationDetails(world, components, entityIndex, index);
};

export const getAllFactions = (world: World, components: Components): Faction[] => {
  const { FactionIndex, IsRegistry } = components;

  const toQuery: QueryFragment[] = [Has(FactionIndex), Has(IsRegistry)];

  // retrieve the relevant entities and their shapes
  const entityIndices = Array.from(runQuery(toQuery));
  return entityIndices.map((index) => getFaction(world, components, index));
};

///////////////
// SHAPES

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

// get a Score object from its EnityIndex
export const getFaction = (
  world: World,
  components: Components,
  index: EntityIndex,
  factionIndex?: number
): Faction => {
  const { FactionIndex, Name, Description } = components;

  const name = getComponentValue(Name, index)?.value as string;

  return {
    ObjectType: 'FACTION',
    id: world.entities[index],
    entityIndex: index,
    index: factionIndex ?? (getComponentValue(FactionIndex, index)?.value as number) * 1,
    name: name,
    description: getComponentValue(Description, index)?.value as string,
    image: getFactionImage(name),
  };
};

// reputation details override for faction shape (diff name style)
export const getReputationDetails = (
  world: World,
  components: Components,
  index: EntityIndex,
  factionIndex?: number
): Faction => {
  const faction = getFaction(world, components, index, factionIndex);
  faction.name = getReputationName(faction.index);
  return faction;
};

///////////////
// IDs

const IDStore = new Map<string, string>();

const getEntityIndex = (world: any, index: number): EntityIndex | undefined => {
  let id = '';
  const key = 'faction' + index.toString();
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(utils.solidityKeccak256(['string', 'uint32'], ['faction', index]));
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};

const getRepEntityIndex = (
  world: any,
  holderID: EntityID | undefined,
  index: number
): EntityIndex | undefined => {
  if (!holderID) return;

  let id = '';
  const key = 'faction.reputation' + holderID + index.toString();
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(
        ['string', 'uint256', 'uint32'],
        ['faction.reputation', holderID, index]
      )
    );
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};

////////////////
// UTILS

const getReputationName = (factionIndex: number): string => {
  if (factionIndex === 1) return 'REPUTATION';
  else return 'LOYALTY';
};
