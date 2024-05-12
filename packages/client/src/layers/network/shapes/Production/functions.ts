import { World } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { getBonusValue } from '../Bonus';
import { getConfigFieldValueArray } from '../Config';
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
export const calcOutput = (production: Production): number => {
  if (!production) return 0;
  let output = production.balance;
  const duration = calcIdleTime(production);
  output += Math.floor(duration * production.rate);
  return Math.max(0, output);
};

export const calcRate = (world: World, components: Components, production: Production): number => {
  if (!production.kami) return 0;
  const kami = production.kami;
  const config = getConfigFieldValueArray(world, components, 'KAMI_HARV_BOUNTY');
  const boostBonus = getBonusValue(world, components, kami.id, 'HARVEST_OUTPUT');
  const fertility = calcFertility(world, components, production);
  const dedication = calcDedication();
  const boost = config[6] + boostBonus;
  const precision = 10 ** config[7];
  return ((fertility + dedication) * boost) / precision;
};

export const calcFertility = (
  world: World,
  components: Components,
  production: Production
): number => {
  if (!production.kami) return 0;
  const kami = production.kami;
  const config = getConfigFieldValueArray(world, components, 'KAMI_HARV_FERTILITY');
  const core = config[2];
  const efficacy = config[6] + calcEfficacyShift(world, components, production); // TODO: fix this to actually calculate efficacy
  const precision = 10 ** (config[3] + config[7]);
  return (kami.stats.power.total * core * efficacy) / (precision * 3600);
};

export const calcDedication = () => 0;

export const calcEfficacyShift = (
  world: World,
  components: Components,
  production: Production
): number => {
  const kami = production.kami;
  const node = production.node;
  if (!kami || !node || !kami.affinities || !node.affinity || node.affinity === 'NORMAL') return 0;
  const config = getConfigFieldValueArray(world, components, 'KAMI_HARV_EFFICACY');
  const neutralShift = config[0];
  const upShift = config[1] + getBonusValue(world, components, kami.id, 'HARVEST_AFFINITY_MULT');
  const downShift = -config[2];

  // calculate based on matchups
  let shift = 0;
  kami.affinities?.forEach((affinity) => {
    if (affinity === 'NORMAL') shift += neutralShift;
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
