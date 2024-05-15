import cdf from '@stdlib/stats-base-dists-normal-cdf';

import { KamiConfig } from '../Config';
import {
  calcProductionBounty,
  calcProductionIdletime,
  getProductionRoomIndex,
} from '../Production';
import { Kami } from './types';

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
  return Math.round(calcHealth(kami)) >= kami.stats.health.total;
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

// determine whether the kami is still on cooldown
export const onCooldown = (kami: Kami): boolean => {
  return calcCooldown(kami) > 0;
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

////////////////
// HEALTH CALCS

// calculate health based on the drain against last confirmed health
// assumes that kami health rate has been updated
export const calcHealth = (kami: Kami): number => {
  let duration = 0;
  if (isHarvesting(kami)) duration = calcHarvestTime(kami);
  else if (isResting(kami)) duration = calcIdleTime(kami);

  let health = kami.stats.health.sync;
  health += kami.stats.health.rate * duration;
  health = Math.floor(Math.max(health, 0));
  health = Math.min(health, kami.stats.health.total);
  return health;
};

// calculate a kami's rate of health change based on its current state
export const calcHealthRate = (kami: Kami, config: KamiConfig): number => {
  if (isHarvesting(kami)) return calcHarvestingHealthRate(kami, config);
  else if (isResting(kami)) return calcRestingHealthRate(kami, config);
  else return 0;
};

// calculate the rate of health drain while harvesting
const calcHarvestingHealthRate = (kami: Kami, config: KamiConfig): number => {
  if (!kami.production) return 0;
  const strainConfig = config.general.strain;
  const ratio = strainConfig.ratio.value;
  const boost = strainConfig.boost.value + kami.bonuses.general.strain.boost;
  const harvestRate = kami.production.rate;
  return -1 * harvestRate * ratio * boost;
};

// calculate the rate of health regen while resting
const calcRestingHealthRate = (kami: Kami, config: KamiConfig): number => {
  const metabolismConfig = config.rest.metabolism;
  const ratio = metabolismConfig.ratio.value;
  const boost = metabolismConfig.boost.value + kami.bonuses.rest.metabolism.boost;
  return (kami.stats.harmony.total * ratio * boost) / 3600;
};

////////////////
// HARVEST

// calculate the expected output from a pet production based on start time
export const calcOutput = (kami: Kami): number => {
  if (!isHarvesting(kami) || !kami.production) return 0;
  else return calcProductionBounty(kami.production);
};

////////////////
// LIQUIDATION

// calculate the affinity multiplier for liquidation threshold
const calcEfficacy = (attacker: Kami, defender: Kami, config: KamiConfig): number => {
  const thresholdConfig = config.liquidation.threshold;
  const effConfig = config.liquidation.efficacy;
  const attBonus = attacker.bonuses.attack.threshold.ratio;
  const defBonus = defender.bonuses.defense.threshold.ratio;

  const base = thresholdConfig.ratio.value;
  const shiftNeut = effConfig.base;
  const shiftUp = effConfig.up + attBonus + defBonus;
  const shiftDown = effConfig.down;

  let shift = shiftNeut;
  if (attacker.traits && defender.traits) {
    const attAffinity = attacker.traits.hand.affinity;
    const defAffinity = defender.traits.body.affinity;
    if (attAffinity === 'EERIE') {
      if (defAffinity === 'SCRAP') shift = shiftUp;
      else if (defAffinity === 'INSECT') shift = shiftDown;
    } else if (attAffinity === 'SCRAP') {
      if (defAffinity === 'INSECT') shift = shiftUp;
      else if (defAffinity === 'EERIE') shift = shiftDown;
    } else if (attAffinity === 'INSECT') {
      if (defAffinity === 'EERIE') shift = shiftUp;
      else if (defAffinity === 'SCRAP') shift = shiftDown;
    }
  }

  return base + shift;
};

// calculate the base liquidation threshold % between two kamis
const calcHostility = (attacker: Kami, defender: Kami, config: KamiConfig): number => {
  const attViolence = attacker.stats.violence.total;
  const defHarmony = defender.stats.harmony.total;
  const base = cdf(Math.log(attViolence / defHarmony), 0, 1);
  const ratio = config.liquidation.hostility.ratio.value;
  return base * ratio;
};

// calculate the liquidation threshold b/w two kamis as a %
export const calcThreshold = (attacker: Kami, defender: Kami, config: KamiConfig): number => {
  const thresholdConfig = config.liquidation.threshold;
  const base = calcHostility(attacker, defender, config);
  const ratio = calcEfficacy(attacker, defender, config);
  const shift = thresholdConfig.shift.value;
  const boost = defender.stats.health.total;
  return (base * ratio + shift) * boost;
};

// determine whether a kami can liquidate another kami based on all requirements
export const canLiquidate = (attacker: Kami, defender: Kami, config: KamiConfig): boolean => {
  return !onCooldown(attacker) && !isStarving(attacker) && canMog(attacker, defender, config);
};

export const canMog = (attacker: Kami, defender: Kami, config: KamiConfig): boolean => {
  return calcHealth(defender) < calcThreshold(attacker, defender, config);
};
