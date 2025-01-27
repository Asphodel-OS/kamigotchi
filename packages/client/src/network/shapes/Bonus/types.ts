import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { hashArgs } from '../utils';
import { getLevel, getType, getValue as getValueComp } from '../utils/component';

export interface Bonus {
  id: EntityID;
  entity: EntityIndex;
  type: string;
  value: number;
  endType?: string;
  duration?: number;
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
// different retrieval functions on the getBonuslevel
const getRegistryEntity = (world: World, comps: Components, entity: EntityIndex): EntityIndex => {
  const { IsRegistry, SourceID } = comps;

  let regEntity: EntityIndex;
  if (IsRegistry.values.value.has(entity)) {
    // is registry entry, take values from here
    regEntity = entity;
  } else {
    // not registry entry, get registry entry
    const regID = getComponentValue(SourceID, entity)?.value as EntityID;
    const rawRegID = world.entityToIndex.get(formatEntityID(regID));
    if (!rawRegID) throw new Error('Bonus: invalid registry entity');
    regEntity = rawRegID;
  }
  return regEntity;
};

export const genTypeID = (type: string, holderID: EntityID): EntityID => {
  return hashArgs(['bonus.type', type, holderID], ['string', 'uint256']);
};

export const genEndAnchor = (type: string, holderID: EntityID): EntityID => {
  return hashArgs(['bonus.ending.type', type, holderID], ['string', 'string', 'uint256']);
};
