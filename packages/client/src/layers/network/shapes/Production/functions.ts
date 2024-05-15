import { KamiConfig } from '../Config';
import { Kami } from '../Kami';
import { Production } from './types';

/////////////////
// DURATION CALCS

// calculate the duration since a production has been collected from
export const calcIdleTime = (production?: Production): number => {
  if (!production) return 0;
  return Date.now() / 1000 - production.time.last;
};

// calculate the duration since a production was started
export const calcLifeTime = (production?: Production): number => {
  if (!production) return 0;
  return Date.now() / 1000 - production.time.start;
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
export const calcRate = (production: Production, kami: Kami, kamiConfig: KamiConfig): number => {
  const config = kamiConfig.harvest.bounty;
  const base = calcFertility(production, kami, kamiConfig);
  const nudge = calcDedication();
  const boost = config.boost.value + kami.bonuses.harvest.bounty.boost;
  return (base + nudge) * boost;
};

export const calcFertility = (
  production: Production,
  kami: Kami,
  kamiConfig: KamiConfig
): number => {
  const config = kamiConfig.harvest.fertility;
  const ratio = config.ratio.value;
  const efficacy = config.boost.value + calcEfficacyShift(production, kami, kamiConfig);
  return (kami.stats.power.total * ratio * efficacy) / 3600;
};

export const calcDedication = () => 0;

export const calcEfficacyShift = (
  production: Production,
  kami: Kami,
  kamiConfig: KamiConfig
): number => {
  const node = production.node;
  if (!node || !kami.affinities || !node.affinity || node.affinity === 'NORMAL') return 0;

  const config = kamiConfig.harvest.efficacy;
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

/////////////////
// MISCELLANEOUS

// interpret the roomIndex of a production
export const getRoomIndex = (production?: Production): number => {
  if (!production || !production.node) return 0;
  return production.node.roomIndex;
};
