import { Production } from './types';

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

// calculate the expected output from a production
export const calcOutput = (production?: Production): number => {
  if (!production) return 0;
  let output = production.balance;
  let duration = calcIdleTime(production);
  output += Math.floor(duration * production?.rate);
  return Math.max(0, output);
};

// interpret the location of a production
export const getLocation = (production?: Production): number => {
  if (!production || !production.node) return 0;
  return production.node.location;
};
