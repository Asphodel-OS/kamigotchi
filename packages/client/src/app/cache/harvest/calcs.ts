import { Harvest } from 'network/shapes/Harvest/types';
import { Kami } from 'network/shapes/Kami';
import { Efficacy } from 'network/shapes/Kami/configs';

/////////////////
// DURATION CALCS

// calculate the duration since a harvest has been collected from
export const calcIdleTime = (harvest: Harvest): number => {
  return Math.floor(Date.now() / 1000 - harvest.time.last);
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

// update the rate of an input harvest according to current conditions
export const updateRate = (harvest: Harvest, kami: Kami) => {
  const rate = calcRate(harvest, kami);
  harvest.rate = rate;
  return rate;
};

// calculate the expected output rate from a harvest
export const calcRate = (harvest: Harvest, kami: Kami): number => {
  if (harvest.state !== 'ACTIVE') return 0;
  if (!kami.config) return 0;

  const config = kami.config?.harvest.bounty;
  const base = calcFertility(harvest, kami);
  const nudge = calcIntensity(harvest, kami);
  const boostBonus = kami.bonuses?.harvest.bounty.boost ?? 0;
  const boost = config.boost.value + boostBonus;
  return (base + nudge) * boost;
};

// Calculate the expected output from a harvest. Round down.
// NOTE: This does notfactor in maximum gains due to depleted health.
export const calcBounty = (harvest: Harvest): number => {
  let output = harvest.balance;
  const duration = calcIdleTime(harvest);
  output += Math.floor(duration * harvest.rate);
  return Math.max(0, output);
};

// Calculate the bounty since last sync.
export const calcNetBounty = (harvest: Harvest): number => {
  const duration = calcIdleTime(harvest);
  return Math.floor(duration * harvest.rate);
};

// calculate the traditional harvesting rate (per hour)
export const calcFertility = (harvest: Harvest, kami: Kami): number => {
  if (!kami.config) return 0;
  const config = kami.config.harvest.fertility;
  const ratio = config.ratio.value;
  const efficacy = config.boost.value + calcEfficacyShifts(harvest, kami);
  const power = kami.stats?.power.total ?? 0;
  const fertility = (power * ratio * efficacy) / 3600;
  return fertility;
};

// calculate the intensity rate of a harvest, measured in musu/s
// NOTE: lots of fuckery in this one
export const calcIntensity = (harvest: Harvest, kami: Kami): number => {
  if (!kami.config) return 0;
  const config = kami.config.harvest.intensity;

  const violence = kami.stats?.violence.total ?? 0;
  const base = config.nudge.value * violence; // commandeering nudge field for this scaling
  const nudge = Math.floor(calcIntensityTime(harvest) / 60);
  const ratio = config.ratio.value; // Intensity Core (Period * scaling to accomodate skill balancing)
  const boostBonus = kami.bonuses?.harvest.intensity.boost ?? 0;
  const boost = config.boost.value + boostBonus;
  const intensity = ((base + nudge) * boost) / (ratio * 3600);

  return intensity;
};

/////////////////
// EFFICACY

enum Effectiveness {
  NEUTRAL,
  UP,
  DOWN,
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
  const bodyAffinity = kami.traits.body.affinity;
  const bodyEffectiveness = getHarvestEffectiveness(nodeAffinity, bodyAffinity);
  const bodyConfig = kami.config.harvest.efficacy.body;
  shift += calcEfficacyShift(bodyEffectiveness, bodyConfig, upShiftBonus);

  // hand
  const handAffinity = kami.traits.hand.affinity;
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
  if (eff === Effectiveness.NEUTRAL) return config.base;
  else if (eff === Effectiveness.UP) return config.up + upShiftBonus;
  else return config.down;
};

// determine how effective a trait matchup is for a harvest
export const getHarvestEffectiveness = (nodeAff: string, traitAff: string): Effectiveness => {
  if (traitAff === 'NORMAL') return Effectiveness.NEUTRAL;
  else if (nodeAff === traitAff) return Effectiveness.UP;
  else return Effectiveness.DOWN;
};
