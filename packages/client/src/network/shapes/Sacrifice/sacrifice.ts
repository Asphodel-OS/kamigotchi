import { EntityID, getComponentValue, World } from 'engine/recs';

import { Components } from 'network/components';
import { hashArgs } from '../utils';

// pity thresholds
export const UNCOMMON_PITY_THRESHOLD = 20;
export const RARE_PITY_THRESHOLD = 100;

// droptable IDs
export const SACRIFICE_DT_NORMAL = hashArgs(['droptable.sacrifice.normal'], ['string']);
export const SACRIFICE_DT_UNCOMMON_PITY = hashArgs(['droptable.sacrifice.uncommon'], ['string']);
export const SACRIFICE_DT_RARE_PITY = hashArgs(['droptable.sacrifice.rare'], ['string']);

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
  return (value?.value as number) ?? 0;
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
