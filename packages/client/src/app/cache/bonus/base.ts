import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Bonus, BonusInstance, calcBonusValue, getBonusRegistry } from 'network/shapes/Bonus';
import { getLevel, getSourceID } from 'network/shapes/utils/component';

const RegistryCache = new Map<EntityIndex, Bonus>();
const InstanceToRegistry = new Map<EntityIndex, EntityIndex>();

// cache for bonus registry. doesnt ever change, assume stable once retrieved
export const getRegistry = (world: World, components: Components, entity: EntityIndex): Bonus => {
  if (!RegistryCache.has(entity)) process(world, components, entity);
  return RegistryCache.get(entity)!;
};

// gets bonus instance. Level is queried live
export const getInstance = (
  world: World,
  components: Components,
  entity: EntityIndex
): BonusInstance => {
  if (!InstanceToRegistry.has(entity)) {
    const source = getSourceID(components, entity);
    InstanceToRegistry.set(entity, world.entityToIndex.get(source) || (0 as EntityIndex));
  }
  const reg = getRegistry(world, components, InstanceToRegistry.get(entity)!);
  const level = getLevel(components, entity);
  return {
    ...reg,
    level,
    total: calcBonusValue(reg.value, level),
  };
};

// save the requested item entity to the cache
export const process = (world: World, components: Components, entity: EntityIndex): Bonus => {
  const bonus = getBonusRegistry(world, components, entity);
  RegistryCache.set(entity, bonus);
  return bonus;
};
