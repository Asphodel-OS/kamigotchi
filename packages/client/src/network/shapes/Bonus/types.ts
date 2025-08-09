import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { DetailedEntity, hashArgs } from '../utils';
import {
  getIsRegistry,
  getLevel,
  getSourceID,
  getType,
  getValue as getValueComp,
} from '../utils/component';
import { getDetailedEntityByID } from '../utils/parse';

export interface Bonus {
  id: EntityID;
  entity: EntityIndex;
  type: string;
  value: number;
  endType?: string;
  duration?: number;
  source?: DetailedEntity; // source registry entity, for display purposes
}

export interface BonusInstance extends Bonus {
  level: number;
  total: number;
}

export const getRegistry = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  precision: number = 0
): Bonus => {
  const { Subtype } = comps;
  return {
    id: world.entities[entity],
    entity: entity,
    type: getType(comps, entity),
    value: getValueComp(comps, entity),
    endType: getComponentValue(Subtype, entity)?.value as string,
    source: getDetailedEntityByID(world, comps, getSourceID(comps, entity)),
  };
};

// get the value of a bonus entity
export const getValue = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  precision = 0
): number => {
  const registryEntity = getRegistryEntity(world, comps, entity);
  const base = getValueComp(comps, registryEntity);
  if (base === undefined) console.warn(`bonus entity missing Value`, world.entities[entity]);
  const level = getLevel(comps, entity, 1);
  return (base * level) / 10 ** precision;
};

////////////////////
// UTILS

// NOTE: this feels like a bit of a codesmell. we probably want to know in
// advance whether we're calling a registry vs an instance and route through
// different retrieval function on the getBonus level
const getRegistryEntity = (world: World, comps: Components, entity: EntityIndex): EntityIndex => {
  if (getIsRegistry(comps, entity)) return entity;

  // get its Registry EntityID by its SourceID
  const rawRegID = getSourceID(comps, entity);
  if (!rawRegID) return 0 as EntityIndex;

  // return the registry entity based on ID
  const regID = formatEntityID(rawRegID);
  const regEntity = world.entityToIndex.get(regID);
  return regEntity ?? (0 as EntityIndex);
};

export const genTypeID = (type: string, holderID: EntityID): EntityID => {
  return hashArgs(['bonus.type', type, holderID], ['string', 'uint256']);
};

export const genEndAnchor = (type: string, holderID: EntityID): EntityID => {
  return hashArgs(['bonus.ending.type', type, holderID], ['string', 'string', 'uint256']);
};
