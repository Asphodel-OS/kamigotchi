/**
 * DAYLIGHT [1]
 * EVENFALL [2]
 * MOONSIDE [3]
 */

// figures out 1, 2, or 3, which time of day it is
export const getCurrPhase = (): number => {
  const hours = Math.floor(Date.now() / 3600000) % 36;
  return Math.floor(hours / 12) + 1;
};

export const getPhaseName = (index: number): string => {
  if (index == 1) return 'DAYLIGHT';
  else if (index == 2) return 'EVENFALL';
  else if (index == 3) return 'MOONSIDE';
  else return '';
};
