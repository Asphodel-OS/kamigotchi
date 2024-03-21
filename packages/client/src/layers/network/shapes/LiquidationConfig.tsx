import { World } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { getConfigFieldValue, getConfigFieldValueArray } from './Config';

// Liquidation Configuration Settings
export interface LiquidationConfig {
  bountyRatio: number; // ratio of harvest received by killer
  threshold: number; // base threshold ceiling (as proportion of max health)
  multipliers: Multipliers;
}

// Multipliers on the liquidation threshold bounds
export interface Multipliers {
  affinity: AffinityMultiplers;
}

// affinity multipliers on liquidation threshold
export interface AffinityMultiplers {
  base: number;
  up: number;
  down: number;
}

// get the Liquidation relevant fields from the world config
export const getLiquidationConfig = (world: World, components: Components): LiquidationConfig => {
  const affinityMultiplierPrecision =
    10 ** getConfigFieldValue(world, components, 'LIQ_THRESH_MULT_AFF_PREC');
  // [base, up, down]
  const affinityMultiplierBaseArr = getConfigFieldValueArray(
    world,
    components,
    'LIQ_THRESH_MULT_AFF'
  );
  const affinityMultiplierUp = affinityMultiplierBaseArr[0];
  const affinityMultiplierDown = affinityMultiplierBaseArr[1];
  const affinityMultiplierBase = affinityMultiplierBaseArr[2];

  const affinityMultipliers: AffinityMultiplers = {
    base: affinityMultiplierBase / affinityMultiplierPrecision,
    up: affinityMultiplierUp / affinityMultiplierPrecision,
    down: affinityMultiplierDown / affinityMultiplierPrecision,
  };

  const multipliers: Multipliers = {
    affinity: affinityMultipliers,
  };

  const bountyBaseArr = getConfigFieldValueArray(world, components, 'LIQ_BOUNTY_BASE');
  const bountyBase = bountyBaseArr[0];
  const bountyBasePrecision = 10 ** bountyBaseArr[1];
  const thresholdBaseArr = getConfigFieldValueArray(world, components, 'LIQ_THRESH_BASE');
  const thresholdBase = thresholdBaseArr[0];
  const thresholdBasePrecision = 10 ** thresholdBaseArr[1];

  return {
    bountyRatio: bountyBase / bountyBasePrecision,
    threshold: thresholdBase / thresholdBasePrecision,
    multipliers,
  };
};
