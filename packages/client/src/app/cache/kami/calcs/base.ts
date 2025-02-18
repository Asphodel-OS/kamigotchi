import { calcHarvestIdleTime, calcHarvestNetBounty, updateHarvestRates } from 'app/cache/harvest';
import { Kami } from 'network/shapes/Kami/types';

////////////////
// STATE CHECKS

// check whether tha kami is available to start a harvest
export const canHarvest = (kami: Kami): boolean => {
  return !onCooldown(kami) && isResting(kami);
};

// naive check right now, needs to be updated with murder check as well
export const isDead = (kami: Kami): boolean => {
  return kami.state === 'DEAD';
};

// check whether the kami is full
export const isFull = (kami: Kami): boolean => {
  const totalHealth = kami.stats?.health.total ?? 0;
  return Math.round(calcHealth(kami)) >= totalHealth;
};

// check whether the kami is harvesting
export const isHarvesting = (kami: Kami): boolean => {
  return kami.state === 'HARVESTING';
};

// check whether the kami is resting
export const isResting = (kami: Kami): boolean => {
  return kami.state === 'RESTING';
};

export const isStarving = (kami: Kami): boolean => {
  return calcHealth(kami) === 0;
};

// check whether the kami is revealed
export const isUnrevealed = (kami: Kami): boolean => {
  return kami.state === 'UNREVEALED';
};

// check whether the kami is captured by slave traders
export const isOffWorld = (kami: Kami): boolean => {
  return kami.state === '721_EXTERNAL';
};

// determine whether the kami is still on cooldown
export const onCooldown = (kami: Kami): boolean => {
  return calcCooldown(kami) > 0;
};

////////////////
// TIME CALCS

// calculate the time a kami has spent idle (in seconds) for the sake of health regen
export const calcIdleTime = (kami: Kami): number => {
  const now = Date.now() / 1000;
  const lastTs = kami.time?.last ?? now;
  return now - lastTs;
};

// calculate the time a harvest has been active since its last update
export const calcHarvestTime = (kami: Kami): number => {
  if (!isHarvesting(kami) || !kami.harvest) return 0;
  return calcHarvestIdleTime(kami.harvest);
};

// calculate the cooldown remaining on kami standard actions
export const calcCooldown = (kami: Kami): number => {
  const requirement = calcCooldownRequirement(kami);
  const now = Date.now() / 1000;
  const lastActionTs = kami.time?.cooldown ?? now;
  const delta = now - lastActionTs;
  const remainingTime = requirement - delta;
  return Math.max(0, remainingTime);
};

// calculate the cooldown requirement for a kami
export const calcCooldownRequirement = (kami: Kami): number => {
  const bonus = kami.bonuses?.general.cooldown ?? 0; // negative if present
  const config = kami.config?.general.cooldown ?? 180; // assume 3min if missing
  return config + bonus;
};

////////////////
// HEALTH CALCS

// calculate health based on the drain against last confirmed health
// assumes that kami health rate has been updated
export const calcHealth = (kami: Kami): number => {
  let duration = 0;
  if (isHarvesting(kami)) duration = calcHarvestTime(kami);
  else if (isResting(kami)) duration = calcIdleTime(kami);

  let health = kami.stats?.health.sync ?? 0;
  health += (calcHealthRate(kami) ?? 0) * duration;
  health = Math.floor(Math.max(health, 0));
  health = Math.min(health, kami.stats?.health.total ?? 0);
  return health;
};

// calculate a kami's health as a percentage of total health
export const calcHealthPercent = (kami: Kami): number => {
  const health = calcHealth(kami);
  const total = kami.stats?.health.total ?? 1;
  return (health / total) * 100;
};

// calculate a kami's rate of health change based on its current state
export const calcHealthRate = (kami: Kami): number => {
  if (isHarvesting(kami)) return calcHarvestingHealthRate(kami);
  else if (isResting(kami)) return calcRestingHealthRate(kami);
  else return 0;
};

// calculate the rate of health drain while harvesting
export const calcHarvestingHealthRate = (kami: Kami): number => {
  if (!kami.harvest) return 0;
  const avgHarvestRate = updateHarvestRate(kami);
  const rate = calcStrainFromBalance(kami, avgHarvestRate, false);
  return -1 * rate;
};

// calculate the rate of health regen while resting
const calcRestingHealthRate = (kami: Kami): number => {
  const metabolismConfig = kami.config?.rest.metabolism;
  if (!metabolismConfig) return 0;

  const ratio = metabolismConfig.ratio.value;
  const boostBonus = kami.bonuses?.rest.metabolism.boost ?? 0;
  const boost = metabolismConfig.boost.value + boostBonus;
  const harmony = kami.stats?.harmony.total ?? 0;
  return (harmony * ratio * boost) / 3600;
};

// assume harvest rate has been updated if it is active
export const updateHealthRate = (kami: Kami): number => {
  if (!kami.stats) return 0;
  const rate = calcHealthRate(kami);
  kami.stats.health.rate = rate;
  return rate;
};

////////////////
// HARVEST

// calculate the expected output from a pet harvest based on start time
export const calcOutput = (kami: Kami): number => {
  if (!isHarvesting(kami) || !kami.harvest) return 0;
  return kami.harvest.balance + calcHarvestNetBounty(kami.harvest);
};

// update the harvest rate on the kami's harvest. do nothing if no harvest
export const updateHarvestRate = (kami: Kami): number => {
  if (!kami.harvest || kami.harvest.state !== 'ACTIVE') return 0;
  return updateHarvestRates(kami.harvest, kami);
};

////////////////////
// UTILS

// calculate a kami's strain from a musu balance, also works with rates
export const calcStrainFromBalance = (kami: Kami, balance: number, roundUp = true): number => {
  const strainConfig = kami.config?.harvest.strain;
  if (!strainConfig) return 0;

  const ratio = strainConfig.ratio.value;
  const harmony = kami.stats?.harmony.total ?? 0;
  const baseHarmony = strainConfig.nudge.value;
  const boostBonus = kami.bonuses?.harvest.strain.boost ?? 0;
  const boost = strainConfig.boost.value + boostBonus;
  const strain = (balance * ratio * boost) / (harmony + baseHarmony);
  return roundUp ? Math.ceil(strain) : strain;
};
