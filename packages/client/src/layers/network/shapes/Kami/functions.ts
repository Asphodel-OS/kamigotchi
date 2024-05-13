import cdf from '@stdlib/stats-base-dists-normal-cdf';
import { LiquidationConfig } from '../LiquidationConfig';
import {
  calcIdleTime as calcProductionIdletime,
  calcOutput as calcProductionOutput,
  getRoomIndex as getProductionRoomIndex,
} from '../Production';
import { Kami } from './types';

////////////////
// STATE CHECKS

// naive check right now, needs to be updated with murder check as well
export const isDead = (kami: Kami): boolean => {
  return kami.state === 'DEAD';
};

// check whether the kami is harvesting
export const isHarvesting = (kami: Kami): boolean => {
  return kami.state === 'HARVESTING';
};

// check whether the kami is resting
export const isResting = (kami: Kami): boolean => {
  return kami.state === 'RESTING';
};

// check whether the kami is revealed
export const isUnrevealed = (kami: Kami): boolean => {
  return kami.state === 'UNREVEALED';
};

// check whether the kami is captured by slave traders
export const isOffWorld = (kami: Kami): boolean => {
  return kami.state === '721_EXTERNAL';
};

// checks whether a kami is with its owner
export const isWithAccount = (kami: Kami): boolean => {
  if (isDead(kami) || isResting(kami) || isUnrevealed(kami)) return true;
  if (isOffWorld(kami)) return false;
  if (isHarvesting(kami)) {
    const accLoc = kami.account?.roomIndex ?? 0;
    const kamiLoc = kami.production?.node?.roomIndex ?? 0;
    if (accLoc == 0 || kamiLoc == 0)
      console.warn(
        `Invalid RoomIndex for kami ${
          kami.index * 1
        }\n\tProduction: ${kamiLoc} \n\tAccount: ${accLoc}`
      );
    return accLoc === kamiLoc;
  }
  console.warn(`Invalid State ${kami.state} for kami ${kami.index * 1}`);
  return false;
};

// interpret the roomIndex of the kami based on the kami's state (using Account and Production Node)
// return 0 if the roomIndex cannot be determined from information provided
export const getRoomIndex = (kami: Kami): number => {
  let roomIndex = 0;
  if (isOffWorld(kami)) roomIndex = 0;
  else if (isHarvesting(kami)) return getProductionRoomIndex(kami.production);
  else {
    if (!kami.account) roomIndex = 0;
    else roomIndex = kami.account.roomIndex;
  }
  return roomIndex;
};

////////////////
// TIME CALCS

// calculate the time a kami has spent idle (in seconds) for the sake of health regen
export const calcIdleTime = (kami: Kami): number => {
  return Date.now() / 1000 - kami.time.last;
};

// calculate the time a production has been active since its last update
export const calcHarvestTime = (kami: Kami): number => {
  if (!isHarvesting(kami)) return 0;
  return calcProductionIdletime(kami.production);
};

// calculate the cooldown remaining on kami standard actions
export const calcCooldown = (kami: Kami): number => {
  const now = Date.now() / 1000;
  const cooldown = kami.time.cooldown;
  const remainingTime = cooldown.requirement - (now - cooldown.last);
  return Math.max(0, remainingTime);
};

// determine whether the kami is still on cooldown
export const onCooldown = (kami: Kami): boolean => {
  return calcCooldown(kami) > 0;
};

////////////////
// HEALTH CALCS

// calculate health based on the drain against last confirmed health
export const calcHealth = (kami: Kami): number => {
  let duration = 0;
  if (isHarvesting(kami)) duration = calcHarvestTime(kami);
  else if (isResting(kami)) duration = calcIdleTime(kami);

  let health = kami.stats.health.sync;
  health += kami.stats.health.rate * duration;
  health = Math.floor(health);
  health = Math.min(Math.max(health, 0), kami.stats.health.total);
  return health;
};

export const isStarving = (kami: Kami): boolean => {
  return calcHealth(kami) === 0;
};

// check whether the kami is full
export const isFull = (kami: Kami): boolean => {
  return Math.round(calcHealth(kami)) >= kami.stats.health.total;
};

// calculate the expected output from a pet production based on start time
export const calcOutput = (kami: Kami): number => {
  if (!isHarvesting(kami) || !kami.production) return 0;
  else return calcProductionOutput(kami.production);
};

////////////////
// HARVEST

export const canHarvest = (kami: Kami): boolean => {
  return !onCooldown(kami) && isResting(kami);
};

////////////////
// LIQUIDATION

// calculate the affinity multiplier for liquidation threshold
const calcLiqAffinityMultiplier = (
  attacker: Kami,
  victim: Kami,
  config: LiquidationConfig
): number => {
  const multiplierBase = config.multipliers.affinity.base;
  const multiplierUp = config.multipliers.affinity.up;
  const multiplierDown = config.multipliers.affinity.down;

  let multiplier = multiplierBase;
  if (attacker.traits && victim.traits) {
    const attackerAffinity = attacker.traits.hand.affinity;
    const victimAffinity = victim.traits.body.affinity;
    if (attackerAffinity === 'EERIE') {
      if (victimAffinity === 'SCRAP') multiplier = multiplierUp;
      else if (victimAffinity === 'INSECT') multiplier = multiplierDown;
    } else if (attackerAffinity === 'SCRAP') {
      if (victimAffinity === 'INSECT') multiplier = multiplierUp;
      else if (victimAffinity === 'EERIE') multiplier = multiplierDown;
    } else if (attackerAffinity === 'INSECT') {
      if (victimAffinity === 'EERIE') multiplier = multiplierUp;
      else if (victimAffinity === 'SCRAP') multiplier = multiplierDown;
    }
  }
  return multiplier;
};

// calculate the base liquidation threshold b/w two kamis as a %
const calcLiqThresholdBase = (attacker: Kami, victim: Kami, config: LiquidationConfig): number => {
  const attackerTotalViolence = attacker.stats.violence.total;
  const victimTotalHarmony = victim.stats.harmony.total;
  const ratio = attackerTotalViolence / victimTotalHarmony;
  const weight = cdf(Math.log(ratio), 0, 1);
  const peakBaseThreshold = config.threshold;
  return weight * peakBaseThreshold;
};

// calculate the liquidation threshold b/w two kamis as a %
const calcLiqThresholdPercent = (
  attacker: Kami,
  victim: Kami,
  config: LiquidationConfig
): number => {
  const base = calcLiqThresholdBase(attacker, victim, config);
  const multiplier = calcLiqAffinityMultiplier(attacker, victim, config);
  return base * multiplier;
};

export const calcLiqThresholdValue = (
  attacker: Kami,
  victim: Kami,
  config: LiquidationConfig
): number => {
  const victimTotalHealth = victim.stats.health.total;
  const thresholdPercent = calcLiqThresholdPercent(attacker, victim, config);
  return thresholdPercent * victimTotalHealth;
};

// determine whether a kami can liquidate another kami
export const canLiquidate = (attacker: Kami, victim: Kami, config: LiquidationConfig): boolean => {
  return !onCooldown(attacker) && !isStarving(attacker) && canMog(attacker, victim, config);
};

export const canMog = (attacker: Kami, victim: Kami, config: LiquidationConfig): boolean => {
  const thresholdPercent = calcLiqThresholdPercent(attacker, victim, config);
  const victimTotalHealth = victim.stats.health.total;
  const absoluteThreshold = thresholdPercent * victimTotalHealth;
  return calcHealth(victim) < absoluteThreshold;
};
