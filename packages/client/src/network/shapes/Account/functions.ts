import { Inventory } from '../Item';
import { Kami, isDead, isOffWorld, isResting, isUnrevealed } from '../Kami';
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
  const recovered = Math.floor(calcStandardIdleTime(account) * account.stamina.rate!);
  const current = account.stamina.sync + recovered;
  return Math.min(account.stamina.base, current);
};

// calculate the current stamina on an account as a percentage of total stamina
export const calcStaminaPercent = (account: Account) => {
  const stamina = calcStamina(account);
  return Math.floor((100 * stamina) / account.stamina.base);
};

//////////////////
// KAMIS

// get kamis accessible to the account
export const getAccessibleKamis = (account: Account): Kami[] => {
  return account.kamis?.filter((kami) => {
    if (isDead(kami) || isResting(kami)) return true;
    if (isUnrevealed(kami) || isOffWorld(kami)) return false;
    const accLoc = account?.roomIndex ?? 0;
    const kamiLoc = kami.production?.node?.roomIndex ?? 0;
    return accLoc === kamiLoc;
  });
};

//////////////////
// INVENTORIES

export const hasFood = (account: Account): boolean => {
  const foods = account.inventories?.filter((inv) => inv.item.type === 'FOOD');
  if (!foods || foods.length == 0) return false;
  const total = foods.reduce((tot: number, inv: Inventory) => tot + (inv.balance || 0), 0);
  return total > 0;
};
