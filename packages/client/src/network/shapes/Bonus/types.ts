import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { BigNumber } from 'ethers';
import { Components } from 'network/';
import { getLevel, getType } from '../utils/component';

export interface Bonus {
  id: EntityID;
  type: string;
  value: number;
  parent?: EntityID;
}

export const getBonus = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  precision: number = 0
): Bonus => {
  const { ParentID } = comps;
  const regEntity = getRegistryEntity(world, comps, entity);

  return {
    id: world.entities[entity],
    type: getType(comps, regEntity),
    value: getBonusValueSingle(world, comps, entity, precision),
    parent: getComponentValue(ParentID, entity)?.value as EntityID,
  };
};

export const getBonusValueSingle = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  precision = 0
): number => {
  const { Value } = comps;
  const registryEntity = getRegistryEntity(world, comps, entity);
  const base = getComponentValue(Value, registryEntity)?.value;
  if (base === undefined) console.warn(`bonus entity missing Value`, world.entities[entity]);
  const level = getLevel(comps, entity, 1);
  return calcValue(base ?? 0, level, precision);
};

const calcValue = (base: number, mult: number, precision: number = 0): number => {
  const raw = BigNumber.from(base);
  return (raw.fromTwos(256).toNumber() / 10 ** precision) * mult;
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
