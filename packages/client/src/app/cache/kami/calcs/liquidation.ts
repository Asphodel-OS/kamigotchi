import cdf from '@stdlib/stats-base-dists-normal-cdf';

import { Kami } from 'network/shapes/Kami';
import { calcHealth, isStarving, onCooldown } from './base';
import { calcOutput, calcStrainFromBalance } from './harvest';

// calculate the affinity multiplier for liquidation threshold
const calcEfficacy = (attacker: Kami, defender: Kami): number => {
  const config = attacker.config ?? defender.config;
  if (!config) return 0;

  const threshConfig = config.liquidation.threshold;
  const effConfig = config.liquidation.efficacy;
  const attBonus = attacker.bonuses?.attack.threshold.ratio ?? 0;
  const defBonus = defender.bonuses?.defense.threshold.ratio ?? 0;

  const base = threshConfig.ratio.value;
  const shiftNeut = effConfig.base;
  const shiftUp = effConfig.up + attBonus - defBonus;
  const shiftDown = effConfig.down;
  const shiftSpec = effConfig.special + attBonus - defBonus;

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
    } else if (attAffinity === 'NORMAL') {
      if (defAffinity === 'NORMAL') shift = shiftSpec;
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
  const ratio = calcEfficacy(attacker, defender);
  const shift = thresholdConfig.shift.value + attShift - defShift;
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
export const calcSpoils = (attacker: Kami, defender: Kami): number => {
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
  return Math.floor(spoils);
};

// calculate the strain of one kami from liquidating another kami
export const calcStrain = (attacker: Kami, defender: Kami): number => {
  const harvest = defender.harvest;
  if (!harvest) return 0;

  const spoils = calcSpoils(attacker, defender);
  return calcStrainFromBalance(attacker, spoils, true);
};

// calculate Karma — Gaussian-based combat multiplier for recoil (PR #2384)
// uses the same CDF curve as calcAnimosity but with defender's violence vs attacker's harmony.
// old formula was linear (v2 - h1 + nudge); new formula is smooth (Gaussian CDF of log ratio).
// result is a multiplier (~0 to karma.ratio.value), NOT raw HP damage.
export const calcKarma = (attacker: Kami, defender: Kami): number => {
  const config = attacker.config ?? defender.config;
  if (!config) return 0;

  const karmaConfig = config.liquidation.karma;
  const defViolence = defender.stats?.violence.total ?? 1;
  const attHarmony = attacker.stats?.harmony.total ?? 1;

  const base = cdf(Math.log(defViolence / attHarmony), 0, 1);
  const ratio = karmaConfig.ratio.value; // karma range (e.g. 2.0 from config [0, 0, 2000, 3, ...])
  return base * ratio;
};

// calculate the affinity-based efficacy nudge applied to recoil (PR #2384)
// mirrors calcEfficacy but uses defender's HAND vs attacker's BODY (opposite direction),
// and reads from KAMI_LIQ_KARMA_EFFICACY config instead of KAMI_LIQ_EFFICACY.
// advantage = defender's hand beats attacker's body → more recoil on the attacker.
export const calcRecoilEfficacy = (attacker: Kami, defender: Kami, baseEfficacy: number): number => {
  const config = attacker.config ?? defender.config;
  if (!config) return Math.max(0, baseEfficacy);

  const effConfig = config.liquidation.karmaEfficacy;

  let shift = effConfig.base; // neutral shift
  if (defender.traits && attacker.traits) {
    // NOTE: reversed direction from threshold efficacy — defender's hand vs attacker's body
    const defAffinity = defender.traits.hand.affinity;
    const atkAffinity = attacker.traits.body.affinity;

    if (defAffinity === 'EERIE') {
      if (atkAffinity === 'SCRAP') shift = effConfig.up;
      else if (atkAffinity === 'INSECT') shift = effConfig.down;
    } else if (defAffinity === 'SCRAP') {
      if (atkAffinity === 'INSECT') shift = effConfig.up;
      else if (atkAffinity === 'EERIE') shift = effConfig.down;
    } else if (defAffinity === 'INSECT') {
      if (atkAffinity === 'EERIE') shift = effConfig.up;
      else if (atkAffinity === 'SCRAP') shift = effConfig.down;
    } else if (defAffinity === 'NORMAL') {
      if (atkAffinity === 'NORMAL') shift = effConfig.special;
    }
  }

  // no bonuses applied here yet (hardcoded zeroes in contract), floor at 0
  return Math.max(0, baseEfficacy + shift);
};

// calculate total liquidation hp recoil (PR #2384)
// old formula: (strain * ratio + karma) * boost — additive karma, single boost
// new formula: (karma + recoilEfficacy) * strain * boost — multiplicative, dual-sided boost
// boost now includes both DEF_RECOIL_BOOST (defender, increases recoil) and
// ATK_RECOIL_BOOST (attacker, reduces recoil). higher boost = more recoil on the attacker.
export const calcRecoil = (attacker: Kami, defender: Kami): number => {
  const baseConfig = attacker.config ?? defender.config;
  if (!baseConfig || !baseConfig.liquidation.recoil) return 0;

  const config = baseConfig.liquidation.recoil;

  const karma = calcKarma(attacker, defender);
  const baseEfficacy = config.nudge.value; // config[0]/10^config[1] — base efficacy value
  const nudge = calcRecoilEfficacy(attacker, defender, baseEfficacy);
  const strain = calcStrain(attacker, defender);

  // boost: config base + defender's DEF_RECOIL_BOOST - attacker's ATK_RECOIL_BOOST
  const atkBoostBonus = attacker.bonuses?.attack.recoil?.boost ?? 0;
  const defBoostBonus = defender.bonuses?.defense.recoil?.boost ?? 0;
  const boostRaw = config.boost.value + defBoostBonus - atkBoostBonus;
  const boost = Math.max(0, boostRaw); // clamp to 0 (can't have negative recoil)

  const recoil = (karma + nudge) * strain * boost;
  return Math.floor(recoil);
};

// determine whether a kami can liquidate another kami based on all requirements
export const canLiquidate = (attacker: Kami, defender: Kami): boolean => {
  return !onCooldown(attacker) && !isStarving(attacker) && canMog(attacker, defender);
};

// check whether a kami can liquidate another kami based on stat requirements
export const canMog = (attacker: Kami, defender: Kami): boolean => {
  return calcHealth(defender) < calcThreshold(attacker, defender);
};
