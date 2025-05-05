import cdf from '@stdlib/stats-base-dists-normal-cdf';

import { Kami } from 'network/shapes/Kami';
import { calcHealth, isStarving, onCooldown } from './base';
import { calcOutput, calcStrainFromBalance } from './harvest';

// calculate the affinity multiplier for liquidation threshold
const calcLiquidationEfficacy = (attacker: Kami, defender: Kami): number => {
  const config = attacker.config ?? defender.config;
  if (!config) return 0;

  const thresholdConfig = config.liquidation.threshold;
  const effConfig = config.liquidation.efficacy;
  const attBonus = attacker.bonuses?.attack.threshold.ratio ?? 0;
  const defBonus = defender.bonuses?.defense.threshold.ratio ?? 0;

  const base = thresholdConfig.ratio.value;
  const shiftNeut = effConfig.base + attBonus + defBonus;
  const shiftUp = effConfig.up + attBonus + defBonus;
  const shiftDown = effConfig.down + attBonus + defBonus;

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
const calcAnimosity = (attacker: Kami, defender: Kami): number => {
  const precision = 10 ** 6;
  const attViolence = attacker.stats?.violence.total ?? 1;
  const defHarmony = defender.stats?.harmony.total ?? 1;
  const config = attacker.config ?? defender.config;
  if (!config) return 0;

  // const base = memoCDF(memoLogDiv(attViolence, defHarmony));
  const base = cdf(Math.log(attViolence / defHarmony), 0, 1);
  const ratio = config.liquidation.animosity.ratio.value;
  return Math.floor(precision * base * ratio) / precision;
};

// calculate the liquidation threshold b/w two kamis
export const calcThreshold = (attacker: Kami, defender: Kami): number => {
  const config = attacker.config ?? defender.config;
  if (!config) return 0;
  const thresholdConfig = config.liquidation.threshold;
  const attShift = attacker.bonuses?.attack.threshold.shift ?? 0;
  const defShift = defender.bonuses?.defense.threshold.shift ?? 0;

  const base = calcAnimosity(attacker, defender);
  const ratio = calcLiquidationEfficacy(attacker, defender);
  const shift = thresholdConfig.shift.value + attShift + defShift;
  const boost = defender.stats?.health.total ?? 0;
  const threshold = (base * ratio + shift) * boost;
  return Math.floor(threshold);
};

// calculate the salvage of a kami having its current harvest liquidated
const calcSalvage = (kami: Kami, balance?: number): number => {
  if (!kami.harvest) return 0;
  if (!kami.config) return 0;

  const config = kami.config.liquidation.salvage;
  const ratioBonus = kami.bonuses?.defense.salvage.ratio ?? 0;
  const power = kami.stats?.power.total ?? 0;

  if (!balance) balance = calcOutput(kami);
  const powerTuning = power / 100 + config.nudge.value;
  const ratio = config.ratio.value + powerTuning + ratioBonus;
  const salvage = balance * ratio;
  return Math.floor(salvage);
};

// calculate the spoils of one kami from liquidating another kami
const calcSpoils = (attacker: Kami, defender: Kami): number => {
  if (!defender.harvest) return 0;
  if (!attacker.config) return 0;

  const config = attacker.config.liquidation.spoils;
  const ratioBonus = attacker.bonuses?.attack.spoils.ratio ?? 0;
  const power = attacker.stats?.power.total ?? 0;

  const balance = calcOutput(defender);
  const salvage = calcSalvage(defender, balance);
  const powerTuning = power / 100 + config.nudge.value;
  const ratio = config.ratio.value + powerTuning + ratioBonus;
  const spoils = (balance - salvage) * Math.min(1, ratio);
  return spoils;
};

// calculate the strain of one kami from liquidating another kami
export const calcStrain = (attacker: Kami, defender: Kami): number => {
  const harvest = defender.harvest;
  if (!harvest) return 0;

  const spoils = calcSpoils(attacker, defender);
  return calcStrainFromBalance(attacker, spoils);
};

// calculate liquidation hp recoil due to violence
export const calcKarma = (attacker: Kami, defender: Kami): number => {
  const config = attacker.config ?? defender.config;
  if (!config) return 0;

  const karmaConfig = config.liquidation.karma;
  const v2 = defender.stats?.violence.total ?? 0;
  const h1 = attacker.stats?.harmony.total ?? 0;
  const diff = Math.max(0, v2 - h1);
  const karma = diff * karmaConfig.ratio.value;
  return Math.floor(karma);
};

// determine whether a kami can liquidate another kami based on all requirements
export const canLiquidate = (attacker: Kami, defender: Kami): boolean => {
  return !onCooldown(attacker) && !isStarving(attacker) && canMog(attacker, defender);
};

// check whether a kami can liquidate another kami based on stat requirements
export const canMog = (attacker: Kami, defender: Kami): boolean => {
  return calcHealth(defender) < calcThreshold(attacker, defender);
};
