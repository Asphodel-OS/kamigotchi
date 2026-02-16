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
// zeroes displayed rates if HP budget is exhausted (starve cutoff)
export const updateHarvestRate = (kami: Kami): number => {
  if (!kami.harvest || kami.harvest.state !== 'ACTIVE') return 0;
  updateHarvestRates(kami.harvest, kami);

  const maxMusu = calcMaxMusu(kami);
  if (maxMusu <= 0 || calcHarvestNetBounty(kami.harvest) >= maxMusu) {
    kami.harvest.rates.total = { average: 0, spot: 0 };
    return 0;
  }

  return kami.harvest.rates.total.average;
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
  const netBounty = calcHarvestNetBounty(kami.harvest);
  const maxMusu = calcMaxMusu(kami);
  const capped = netBounty < maxMusu ? netBounty : maxMusu;
  return kami.harvest.balance + capped;
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

// Max MUSU a kami can earn given its current HP. Inverse of calcStrainFromBalance.
// strain = amt * ratio * boost / (harmony + base) => max_amt = hp * (harmony + base) / (ratio * boost)
export const calcMaxMusu = (kami: Kami): number => {
  const hp = kami.stats?.health.sync ?? 0;
  if (hp <= 0) return 0;

  const config = kami.config?.harvest.strain;
  if (!config) return Infinity;

  const ratio = config.ratio.value;
  const harmony = kami.stats?.harmony.total ?? 0;
  const baseHarmony = config.nudge.value;
  const boostBonus = kami.bonuses?.harvest.strain.boost ?? 0;
  const boost = config.boost.value + boostBonus;
  const denom = ratio * boost;
  if (denom === 0) return Infinity;

  return Math.floor((hp * (harmony + baseHarmony)) / denom);
};

