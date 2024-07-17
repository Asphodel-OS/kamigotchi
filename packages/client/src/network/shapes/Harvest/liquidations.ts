import cdf from '@stdlib/stats-base-dists-normal-cdf';

import {
  calcHealth,
  calcOutput,
  calcStrainFromBalance,
  isStarving,
  Kami,
  onCooldown,
} from '../Kami';

////////////////
// LIQUIDATION

// calculate the affinity multiplier for liquidation threshold
const calcLiquidationEfficacy = (attacker: Kami, defender: Kami): number => {
  const thresholdConfig = attacker.config.liquidation.threshold;
  const effConfig = attacker.config.liquidation.efficacy;
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
const calcAnimosity = (attacker: Kami, defender: Kami): number => {
  const precision = 10 ** 6;
  const attViolence = attacker.stats.violence.total;
  const defHarmony = defender.stats.harmony.total;
  const base = cdf(Math.log(attViolence / defHarmony), 0, 1);
  const ratio = attacker.config.liquidation.animosity.ratio.value;
  return Math.floor(precision * base * ratio) / precision;
};

// calculate the liquidation threshold b/w two kamis
export const calcThreshold = (attacker: Kami, defender: Kami): number => {
  const thresholdConfig = attacker.config.liquidation.threshold;
  const attBonus = attacker.bonuses.attack.threshold;
  const defBonus = defender.bonuses.defense.threshold;

  const base = calcAnimosity(attacker, defender);
  const ratio = calcLiquidationEfficacy(attacker, defender);
  const shift = thresholdConfig.shift.value + attBonus.shift + defBonus.shift;
  const boost = defender.stats.health.total;
  const threshold = (base * ratio + shift) * boost;
  return Math.floor(threshold);
};

// calculate the salvage of a kami having its current production liquidated
const calcSalvage = (kami: Kami, balance?: number): number => {
  const salvageConfig = kami.config.liquidation.salvage;
  const salvageBonus = kami.bonuses.defense.salvage;
  const harvest = kami.production;
  if (!harvest) return 0;

  if (!balance) balance = calcOutput(kami);
  const salvageRatio = salvageConfig.ratio.value + salvageBonus.ratio;
  const salvage = balance * salvageRatio;
  return Math.floor(salvage);
};

// calculate the spoils of one kami from liquidating another kami
const calcSpoils = (attacker: Kami, defender: Kami): number => {
  const spoilsConfig = attacker.config.liquidation.spoils;
  const spoilsBonus = attacker.bonuses.attack.spoils;
  const harvest = defender.production;
  if (!harvest) return 0;

  const balance = calcOutput(defender);
  const salvage = calcSalvage(defender, balance);
  const spoilsRatio = spoilsConfig.ratio.value + spoilsBonus.ratio;
  const spoils = (balance - salvage) * spoilsRatio;
  return spoils;
};

// calculate the strain of one kami from liquidating another kami
export const calcStrain = (attacker: Kami, defender: Kami): number => {
  const harvest = defender.production;
  if (!harvest) return 0;

  const spoils = calcSpoils(attacker, defender);
  return calcStrainFromBalance(attacker, spoils);
};

// calculate liquidation hp recoil due to violence
export const calcKarma = (attacker: Kami, defender: Kami): number => {
  const karmaConfig = attacker.config.liquidation.karma;
  const totalViolence = attacker.stats.violence.total + defender.stats.violence.total;
  const karma = totalViolence * karmaConfig.ratio.value;
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
