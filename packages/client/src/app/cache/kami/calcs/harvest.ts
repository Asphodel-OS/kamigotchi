import { calcHarvestIdleTime, calcHarvestNetBounty, updateHarvestRates } from 'app/cache/harvest';
import { Kami } from 'network/shapes/Kami/types';
import { isHarvesting } from './base';

////////////////
// TIME

// calculate the time a harvest has been active since its last update
export const calcHarvestTime = (kami: Kami): number => {
  if (!isHarvesting(kami) || !kami.harvest) return 0;
  return calcHarvestIdleTime(kami.harvest);
};

////////////////
// RATES

// update the harvest rate on the kami's harvest. do nothing if no harvest
export const updateHarvestRate = (kami: Kami): number => {
  if (!kami.harvest || kami.harvest.state !== 'ACTIVE') return 0;
  return updateHarvestRates(kami.harvest, kami);
};

// calculate the rate of health drain while harvesting
export const calcHarvestingHealthRate = (kami: Kami): number => {
  if (!kami.harvest) return 0;
  updateHarvestRate(kami);
  const rate = calcStrainFromBalance(kami, kami.harvest.rates.total.spot, false);
  return -1 * rate;
};

////////////////
// OUTPUT

// calculate the expected output from a pet harvest based on start time
export const calcOutput = (kami: Kami): number => {
  if (!isHarvesting(kami) || !kami.harvest) return 0;
  return kami.harvest.balance + calcHarvestNetBounty(kami.harvest);
};

////////////////////
// UTILS

// calculate a kami's strain from a musu balance, also works with rates
export const calcStrainFromBalance = (kami: Kami, balance: number, roundUp = true): number => {
  const config = kami.config?.harvest.strain;
  if (!config) return 0;

  const ratio = config.ratio.value;
  const harmony = kami.stats?.harmony.total ?? 0;
  const baseHarmony = config.nudge.value;
  const boostBonus = kami.bonuses?.harvest.strain.boost ?? 0;
  const boost = config.boost.value + boostBonus;
  const strain = (balance * ratio * boost) / (harmony + baseHarmony);
  return roundUp ? Math.ceil(strain) : strain;
};
