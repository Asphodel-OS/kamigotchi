import { Account } from './types';

/////////////////
// TIME

export const calcIdleTime = (account: Account) => {
  return Date.now() / 1000 - account.time.last;
};

export const calcStandardIdleTime = (account: Account) => {
  return Date.now() / 1000 - account.time.lastMove;
};

/////////////////
// STAMINA

// calculate the current stamina on an account
export const calcStamina = (account: Account) => {
  const recovered = Math.floor(
    calcStandardIdleTime(account) / account.stamina.recoveryPeriod
  );
  const current = account.stamina.last + recovered;
  return Math.min(account.stamina.total, current);
};

// calculate the current stamina on an account as a percentage of total stamina
export const calcStaminaPercent = (account: Account) => {
  const stamina = calcStamina(account);
  return Math.floor((100 * stamina) / account.stamina.total);
};
