import { World } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { getConfigFieldValue } from './Config';

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
    10 ** getConfigFieldValue(components, 'LIQ_THRESH_MULT_AFF_PREC');
  const affinityMultiplierUp = getConfigFieldValue(components, 'LIQ_THRESH_MULT_AFF_UP');
  const affinityMultiplierDown = getConfigFieldValue(components, 'LIQ_THRESH_MULT_AFF_DOWN');
  const affinityMultiplierBase = getConfigFieldValue(components, 'LIQ_THRESH_MULT_AFF_BASE');

  const affinityMultipliers: AffinityMultiplers = {
    base: affinityMultiplierBase / affinityMultiplierPrecision,
    up: affinityMultiplierUp / affinityMultiplierPrecision,
    down: affinityMultiplierDown / affinityMultiplierPrecision,
  };

  const multipliers: Multipliers = {
    affinity: affinityMultipliers,
  };

  const bountyBase = getConfigFieldValue(components, 'LIQ_BOUNTY_BASE');
  const bountyBasePrecision = 10 ** getConfigFieldValue(components, 'LIQ_BOUNTY_BASE_PREC');
  const thresholdBase = getConfigFieldValue(components, 'LIQ_THRESH_BASE');
  const thresholdBasePrecision = 10 ** getConfigFieldValue(components, 'LIQ_THRESH_BASE_PREC');

  return {
    bountyRatio: bountyBase / bountyBasePrecision,
    threshold: thresholdBase / thresholdBasePrecision,
    multipliers,
  };
};
