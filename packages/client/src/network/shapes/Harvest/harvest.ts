import { Kami } from '../Kami';
import { Harvest } from './types';

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

// calculate the expected output rate from a harvest
export const calcRate = (harvest: Harvest, kami: Kami): number => {
  if (harvest.state !== 'ACTIVE') return 0;
  const config = kami.config.harvest.bounty;
  const base = calcFertility(harvest, kami);
  const nudge = calcIntensity(harvest, kami);
  const boost = config.boost.value + kami.bonuses.harvest.bounty.boost;
  return (base + nudge) * boost;
};

// calculate the traditional harvesting rate (per hour)
export const calcFertility = (harvest: Harvest, kami: Kami): number => {
  const config = kami.config.harvest.fertility;
  const ratio = config.ratio.value;
  const efficacy = config.boost.value + calcEfficacyShift(harvest, kami);
  const fertility = (kami.stats.power.total * ratio * efficacy) / 3600;
  return fertility;
};

// calculate the shift in harvest Efficacy (Fertility Boost)
export const calcEfficacyShift = (harvest: Harvest, kami: Kami): number => {
  const node = harvest.node;
  if (!node || !kami.traits || !node.affinity || node.affinity === 'NORMAL') return 0;

  const affinities = [kami.traits.body.affinity, kami.traits.hand.affinity];
  const config = kami.config.harvest.efficacy;
  const neutShift = config.base;
  const upShift = config.up + kami.bonuses.harvest.fertility.boost;
  const downShift = config.down;

  // calculate based on matchups
  let shift = 0;
  affinities?.forEach((affinity) => {
    if (affinity === 'NORMAL') shift += neutShift;
    else if (affinity === node.affinity) shift += upShift;
    else shift += downShift;
  });
  return shift;
};

// calculate the intensity rate of a harvest, measured in musu/s
// NOTE: lots of fuckery in this one
export const calcIntensity = (harvest: Harvest, kami: Kami): number => {
  const config = kami.config.harvest.intensity;

  const base = config.nudge.value * kami.stats.violence.total; // commandeering nudge field for this scaling
  const nudge = Math.floor(calcIntensityTime(harvest) / 60);
  const ratio = config.ratio.value; // Intensity Core (Period * scaling to accomodate skill balancing)
  const boost = config.boost.value + kami.bonuses.harvest.intensity.nudge;
  const intensity = ((base + nudge) * boost) / (ratio * 3600);

  return intensity;
};
