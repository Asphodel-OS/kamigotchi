import { DaylightIcon, EvenfallIcon, MoonsideIcon } from 'assets/images/icons/phases';
/////////////////
// KAMITIME

// parse an epoch time to KamiWorld Military Time (36h days)
export const getKamiTime = (epochTime?: number, precision = 3): string => {
  let time = (epochTime ?? Date.now()) / 10 ** precision;
  time = Math.floor(time);
  const seconds = time % 60;
  time = Math.floor(time / 60);
  const minutes = time % 60;
  time = Math.floor(time / 60);
  const hours = time % 36;

  const hourString = hours.toString().padStart(2, '0');
  const minuteString = minutes.toString().padStart(2, '0');
  const secondString = seconds.toString().padStart(2, '0');

  return `${hourString}:${minuteString}:${secondString}`;
};

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

export const getPhaseIcon = (index: number): string => {
  if (index == 1) return DaylightIcon;
  else if (index == 2) return EvenfallIcon;
  else if (index == 3) return MoonsideIcon;
  else return '';
};

/////////////////
// IRL TIME

// parse an epoch time into a date string
export const getDateString = (epochTime?: number, precision = 3): string => {
  const time = epochTime ? epochTime * 10 ** (3 - precision) : Date.now();
  const date = new Date(time);
  return date.toLocaleString('default', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};
