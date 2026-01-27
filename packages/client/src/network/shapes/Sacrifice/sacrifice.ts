import { EntityID, getComponentValue, World } from 'engine/recs';

import { Components } from 'network/components';
import { getData } from '../Data';
import { hashArgs } from '../utils';

// pity thresholds
export const UNCOMMON_PITY_THRESHOLD = 20;
export const RARE_PITY_THRESHOLD = 100;

/**
 * sacrifice pity count for an account
 * @param world  RECS world
 * @param components  component registry
 * @param accID account entity ID
 * @returns  current pity count (number of sacrifices since last pity reward)
 */
export const getSacrificePityCount = (
  world: World,
  components: Components,
  accID: EntityID
): number => {
  const { Value } = components;

  const pityEntityID = hashArgs(['sacrifice.pity', accID], ['string', 'uint256']);
  if (!pityEntityID) return 0;

  const entityIndex = world.entityToIndex.get(pityEntityID);
  if (entityIndex === undefined) return 0;

  const value = getComponentValue(Value, entityIndex);
  return Number(value?.value ?? 0);
};
// returns worldwide kami sacrifice count
export const getSacrificeTotal = (world: World, comps: Components) => {
  return getData(world, comps, '0' as EntityID, 'KAMI_SACRIFICE_TOTAL', 0);
};

/**
 * progress toward the next uncommon pity (every 20 sacrifices)
 * @returns Object with current count and threshold
 */
export const getUncommonPityProgress = (
  world: World,
  components: Components,
  accID: EntityID
): { current: number; threshold: number } => {
  const pityCount = getSacrificePityCount(world, components, accID);
  return {
    current: pityCount % UNCOMMON_PITY_THRESHOLD,
    threshold: UNCOMMON_PITY_THRESHOLD,
  };
};

/**
 * progress toward the next rare pity (every 100 sacrifices)
 * @returns  current count and threshold
 */
export const getRarePityProgress = (
  world: World,
  components: Components,
  accID: EntityID
): { current: number; threshold: number } => {
  const pityCount = getSacrificePityCount(world, components, accID);
  return {
    current: pityCount % RARE_PITY_THRESHOLD,
    threshold: RARE_PITY_THRESHOLD,
  };
};
