import { Kami } from '../Kami';
import { Production } from './types';

/////////////////
// DURATION CALCS

// calculate the duration since a production has been collected from
export const calcIdleTime = (production?: Production): number => {
  if (!production) return 0;
  return Math.floor(Date.now() / 1000 - production.time.last);
};

// get the number of seconds passed since the last production reset
export const calcIntensityTime = (production: Production): number => {
  if (!production || !production.time.reset) return 0;
  const secondsSinceReset = Date.now() / 1000 - production.time.reset;
  return Math.floor(secondsSinceReset); // intensity period
};

// calculate the duration since a production was started
export const calcLifeTime = (production?: Production): number => {
  if (!production) return 0;
  return Math.floor(Date.now() / 1000 - production.time.start);
};

/////////////////
// OUTPUT CALCS

// calculate the expected output from a production
// assumes the production rate has been updated
export const calcBounty = (production: Production): number => {
  let output = production.balance;
  const duration = calcIdleTime(production);
  output += Math.floor(duration * production.rate);
  return Math.max(0, output);
};

// calculate the expected output rate from a production
export const calcRate = (production: Production, kami: Kami): number => {
  if (production.state !== 'ACTIVE') return 0;
  const config = kami.config.harvest.bounty;
  const base = calcFertility(production, kami);
  const nudge = calcDedication(production, kami);
  const boost = config.boost.value + kami.bonuses.harvest.bounty.boost;
  return (base + nudge) * boost;
};

// calculate the traditional harvesting rate (per hour)
export const calcFertility = (production: Production, kami: Kami): number => {
  const config = kami.config.harvest.fertility;
  const ratio = config.ratio.value;
  const efficacy = config.boost.value + calcEfficacyShift(production, kami);
  return (kami.stats.power.total * ratio * efficacy) / 3600;
};

// calculate the Intensity-based harvesting rate
export const calcDedication = (production: Production, kami: Kami) => {
  const precision = 1e9; // figure to truncate by
  const config = kami.config.harvest.dedication;
  const ratio = config.ratio.value;
  const intensity = calcIntensity(production, kami);
  const dedication = Math.floor(precision * ratio * intensity ** 2) / precision;
  return dedication;
};

export const calcEfficacyShift = (production: Production, kami: Kami): number => {
  const node = production.node;
  if (!node || !kami.affinities || !node.affinity || node.affinity === 'NORMAL') return 0;

  const config = kami.config.harvest.efficacy;
  const neutShift = config.base;
  const upShift = config.up + kami.bonuses.harvest.fertility.boost;
  const downShift = config.down;

  // calculate based on matchups
  let shift = 0;
  kami.affinities?.forEach((affinity) => {
    if (affinity === 'NORMAL') shift += neutShift;
    else if (affinity === node.affinity) shift += upShift;
    else shift += downShift;
  });
  return shift;
};

export const calcIntensity = (production: Production, kami: Kami): number => {
  const precision = 1e9; // figure to truncate by
  const config = kami.config.harvest.intensity;
  const base = Math.floor(calcIntensityTime(production) / 60);
  const nudge = kami.bonuses.harvest.intensity.nudge;
  const ratio = config.ratio.value; // intensity period
  const intensity = Math.floor(precision * ((base + nudge) / ratio)) / precision;
  return intensity;
};

/////////////////
// MISCELLANEOUS

// interpret the roomIndex of a production
export const getRoomIndex = (production?: Production): number => {
  if (!production || !production.node) return 0;
  return production.node.roomIndex;
};
