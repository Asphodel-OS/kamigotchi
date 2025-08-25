import { Stat } from 'network/shapes/Stats';
import { Account } from '../account';

/////////////////
// STAMINA

// NOTE: does not yet include bonuses
// assume that Account Stamina and Config are populated
export const calcCurrentStamina = (account: Account): number => {
  if (!account.config) return 0;
  const recoveryPeriod = account.config.stamina.recovery ?? 60;
  const timeDelta = Date.now() / 1000 - account.time.action;
  const recovered = Math.floor(timeDelta / recoveryPeriod);
  return sync(account.stamina, recovered);
};

/////////////////
// TIME

// calculate idle time in reference to any last action
export const calcIdleTime = (account: Account) => {
  return Date.now() / 1000 - account.time.last;
};

///////////////////
// TODO: move these elsewhere for more generalized access

// calculate the current stamina on an account as a percentage of total stamina
export const calcStatPercent = (stat: Stat) => {
  if (stat.total == 0) return 100;
  return Math.floor((100 * stat.sync) / stat.total);
};

// calculate the sync value of a Stat with the given delta (added to sync)
// bounds by 0 and statTotal
export const sync = (stat: Stat, delta: number): number => {
  const rawSum = stat.sync + delta;
  return Math.min(stat.total, Math.max(0, rawSum));
};
