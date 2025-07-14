import { Harvest, RateDetails } from 'network/shapes/Harvest/types';
import { Kami } from 'network/shapes/Kami';
import { Efficacy } from 'network/shapes/Kami/configs';
import { getKamiBodyAffinity, getKamiHandAffinity } from '../kami';

/////////////////
// DURATION CALCS

// calculate the duration since a harvest has been collected from
export const calcIdleTime = (harvest: Harvest): number => {
  if (!harvest.time.last) return 0;
  const secondsSinceLast = Date.now() / 1000 - harvest.time.last;
  return Math.floor(secondsSinceLast); // intensity period
};

// get the number of seconds passed since the last harvest reset
export const calcIntensityTime = (harvest: Harvest): number => {
  if (!harvest.time.reset) return 0;
  const secondsSinceReset = Date.now() / 1000 - harvest.time.reset;
  return Math.floor(secondsSinceReset); // intensity period
};

// calculate the duration since a harvest was started
export const calcLifeTime = (harvest: Harvest): number => {
  return Math.floor(Date.now() / 1000 - harvest.time.start);
};

/////////////////
// OUTPUT CALCS

// Calculate the expected output from a harvest. Round down.
export const calcBounty = (harvest: Harvest): number => {
  const output = harvest.balance + calcNetBounty(harvest);
  return Math.max(0, output);
};

// Calculate the bounty since last sync.
// NOTE: rates must be calculated with updateRates first
export const calcNetBounty = (harvest: Harvest): number => {
  const duration = calcIdleTime(harvest);
  const rate = harvest.rates.total.average;
  return Math.floor(duration * rate);
};

/////////////////
// RATE CALCS

// update the rate of an input harvest according to current conditions
// return the average total rate
export const updateRates = (harvest: Harvest, kami: Kami) => {
  if (harvest.state !== 'ACTIVE') return 0;
  if (!kami.config) return 0;
  const config = kami.config?.harvest.bounty;
  const boostBonus = kami.bonuses?.harvest.bounty.boost ?? 0;
  const boost = config.boost.value + boostBonus;

  const fertility = calcFertility(harvest, kami);
  const intensity = calcIntensity(harvest, kami);

  harvest.rates = {
    fertility,
    intensity,
    total: {
      average: boost * (fertility + intensity.average),
      spot: boost * (fertility + intensity.spot),
    },
  };
  return harvest.rates.total.average;
};

// calculate the fertility rate of harvest (per hour)
export const calcFertility = (harvest: Harvest, kami: Kami): number => {
  if (!kami.config) return 0;
  const config = kami.config.harvest.fertility;
  const ratio = config.ratio.value;
  const efficacy = config.boost.value + calcEfficacyShifts(harvest, kami);
  const power = kami.stats?.power.total ?? 0;
  const fertility = (power * ratio * efficacy) / 3600;
  return Math.floor(fertility * 1e6) / 1e6;
};

// calculate the intensity rates of a harvest, measured in musu/s
export const calcIntensity = (harvest: Harvest, kami: Kami): RateDetails => {
  const now = Date.now() / 1000;
  const lastTs = harvest.time?.last ?? now;
  const resetTs = harvest.time?.reset ?? now;

  const initial = calcIntensityAt(kami, lastTs - resetTs);
  const current = calcIntensityAt(kami, now - resetTs);
  const spot = initial + 2 * (current - initial);

  return {
    average: Math.floor(current * 1e6) / 1e6,
    spot: Math.floor(spot * 1e6) / 1e6,
  };
};

/**
 * @dev calculate the intensity rate of a Kami's Harvest at a given time delta
 * past its last reset time, measured in musu/s (1e6 precision)
 *
 * @param kami: Kami. should have configs and bonuses populated
 * @param delta: seconds past last reset
 * */

const calcIntensityAt = (kami: Kami, delta: number) => {
  if (!kami.config) return 0;
  const config = kami.config.harvest.intensity;
  const bonus = kami.bonuses?.harvest.intensity;

  const boost = config.boost.value + (bonus?.boost ?? 0);
  const ratio = config.ratio.value * 3600; // Constant (Period * scaling)
  const core = boost / ratio;

  const violence = kami.stats?.violence.total ?? 0;
  const base = config.nudge.value * violence; // commandeering nudge field for this scaling

  const deltaMinutes = Math.floor(delta / 60);
  return core * (base + deltaMinutes);
};

/////////////////
// EFFICACY

enum Effectiveness {
  NEUTRAL,
  UP,
  DOWN,
  SPECIAL,
}

// calculate the shift in harvest Efficacy (Fertility Boost)
export const calcEfficacyShifts = (harvest: Harvest, kami: Kami): number => {
  const node = harvest.node;
  if (!node || !kami.traits || !node.affinity || node.affinity === 'NORMAL') return 0;
  if (!kami.config) return 0;

  let shift = 0;
  const nodeAffinity = node.affinity;
  const upShiftBonus = kami.bonuses?.harvest.fertility.boost ?? 0;

  // body
  const bodyAffinity = getKamiBodyAffinity(kami);
  const bodyEffectiveness = getHarvestEffectiveness(nodeAffinity, bodyAffinity);
  const bodyConfig = kami.config.harvest.efficacy.body;
  shift += calcEfficacyShift(bodyEffectiveness, bodyConfig, upShiftBonus);

  // hand
  const handAffinity = getKamiHandAffinity(kami);
  const handEffectiveness = getHarvestEffectiveness(nodeAffinity, handAffinity);
  const handConfig = kami.config.harvest.efficacy.hand;
  shift += calcEfficacyShift(handEffectiveness, handConfig, upShiftBonus);

  return shift;
};

// calculate the shift in Harvest Efficacy resulting from a trait matchup
export const calcEfficacyShift = (
  eff: Effectiveness,
  config: Efficacy,
  upShiftBonus: number
): number => {
  if (eff === Effectiveness.UP) return config.up + upShiftBonus;
  if (eff === Effectiveness.NEUTRAL) return config.base;
  if (eff === Effectiveness.DOWN) return config.down;
  return config.special;
};

// determine how effective a trait matchup is for a harvest
export const getHarvestEffectiveness = (nodeAff: string, traitAff: string): Effectiveness => {
  if (nodeAff === 'NORMAL' && traitAff === 'NORMAL') return Effectiveness.SPECIAL;
  if (nodeAff === 'NORMAL' || traitAff === 'NORMAL') return Effectiveness.NEUTRAL;
  if (nodeAff === traitAff) return Effectiveness.UP;
  return Effectiveness.DOWN;
};
