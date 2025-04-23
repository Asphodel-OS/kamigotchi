import { DaylightIcon, EvenfallIcon, MoonsideIcon } from 'assets/images/icons/phases';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * 60;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24;

/////////////////
// NORMIETIME

export const formatCountdown = (secs: number) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : n);

  const h = Math.floor(secs / 3600);
  const m = Math.floor(secs / 60) - h * 60;
  const s = Math.floor(secs - h * 3600 - m * 60);

  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

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

// get the string representation of a time delta (s)
// NOTE: logic here is a bit messy. clean this up at some point
export const getTimeDeltaString = (delta: number): string => {
  if (delta > SECONDS_PER_DAY) {
    const days = Math.floor(delta / SECONDS_PER_DAY);
    const hours = Math.floor((delta % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
    return `${days} days ${hours} hours ago`;
  } else if (delta > SECONDS_PER_HOUR) {
    const hours = Math.floor(delta / SECONDS_PER_HOUR);
    const minutes = Math.floor((delta % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    return `${hours} hours ${minutes} minutes ago`;
  } else {
    const minutes = Math.floor(delta / SECONDS_PER_MINUTE);
    return `${minutes} minutes ago`;
  }
};

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

export const getKamiDate = (epochTime?: number, precision = 3): string => {
  let time = (epochTime ?? Date.now()) / 10 ** precision;
  time = Math.floor(time / 60 / 60 / 44);
  const days = (time % 44) + 1;
  time = Math.floor(time / 18);
  const months = (time % 18) + 1;

  const monthString = months.toString().padStart(2, '0');
  const dayString = days.toString().padStart(2, '0');
  return `${monthString}å${dayString}`;
};

export const getKamiDT = (epochTime?: number, precision = 3): string => {
  let time = (epochTime ?? Date.now()) / 10 ** precision;
  time = Math.floor(time);
  const seconds = time % 60;
  time = Math.floor(time / 60);
  const minutes = time % 60;
  time = Math.floor(time / 60);
  const hours = time % 36;
  time = Math.floor(time / 44);
  const days = (time % 44) + 1;
  time = Math.floor(time / 18);
  const months = (time % 18) + 1;

  const monthString = months.toString().padStart(2, '0');
  const dayString = days.toString().padStart(2, '0');
  const hourString = hours.toString().padStart(2, '0');
  const minuteString = minutes.toString().padStart(2, '0');
  const secondString = seconds.toString().padStart(2, '0');

  return `${monthString}◆${dayString} ${hourString}:${minuteString}:${secondString}`;
};

/**
 * DAYLIGHT [1]
 * EVENFALL [2]
 * MOONSIDE [3]
 */

// figures out 1, 2, or 3, which time of day it is
export const getCurrPhase = (): number => {
  return getPhaseOf(Date.now());
};

export const getPhaseOf = (epochTime: number, precision = 3): number => {
  epochTime = epochTime / 10 ** precision;
  const hours = Math.floor(epochTime / 3600) % 36;
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
