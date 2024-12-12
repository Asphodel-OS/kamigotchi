import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { BigNumber } from 'ethers';
import { Components } from 'network/';
import { hashArgs } from '../utils';

export interface Bonus {
  id: EntityID;
  type: string;
  value: number;
  parent?: EntityID;
}

export const getBonus = (
  world: World,
  components: Components,
  entity: EntityIndex,
  precision: number = 0
): Bonus => {
  const { Level, ParentID, Type, Value } = components;

  const regEntity = getRegistryEntity(world, components, entity);

  return {
    id: world.entities[entity],
    type: (getComponentValue(Type, regEntity)?.value as string) || '',
    value: calcValue(
      getComponentValue(Value, regEntity)?.value as number, // base
      (getComponentValue(Level, entity)?.value || 1) * 1, // mult
      precision
    ),
    parent: getComponentValue(ParentID, entity)?.value as EntityID,
  };
};

export const getBonusValueSingle = (
  world: World,
  components: Components,
  entity: EntityIndex,
  precision: number = 0
): number => {
  const { Level, Value } = components;

  const regEntity = getRegistryEntity(world, components, entity);

  return calcValue(
    getComponentValue(Value, regEntity)?.value as number, // base
    (getComponentValue(Level, entity)?.value || 1) * 1, // mult
    precision
  );
};

const calcValue = (base: number, mult: number, precision: number = 0): number => {
  const raw = BigNumber.from(base);
  return (raw.fromTwos(256).toNumber() / 10 ** precision) * mult;
};

////////////////////
// UTILS

const getRegistryEntity = (
  world: World,
  components: Components,
  entity: EntityIndex
): EntityIndex => {
  const { IsRegistry, SourceID } = components;

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

export const getTypeID = (field: string, holderID: EntityID): string => {
  return hashArgs(['bonus.type', field, holderID], ['string', 'string', 'uint256']);
};
