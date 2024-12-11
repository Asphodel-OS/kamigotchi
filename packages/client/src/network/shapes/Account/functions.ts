import { EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getConfigFieldValue } from '../Config';
import { Inventory } from '../Item';
import { Kami, isDead, isOffWorld, isResting, isUnrevealed } from '../Kami';
import { Stat, getStat, sync } from '../Stats';
import { Account } from './types';

/////////////////
// GETTERS

// does not include bonuses
export const getStamina = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Stat => {
  const { Stamina } = components;
  const recoveryPeriod = getConfigFieldValue(world, components, 'ACCOUNT_STAMINA_RECOVERY_PERIOD');

  const stamina = getStat(entityIndex, Stamina);
  stamina.rate = (1 / (recoveryPeriod ?? 300)) * 1;

  // sync
  const recovered = Math.floor(calcStandardIdleTime(components, entityIndex) * (stamina.rate ?? 0));
  stamina.sync = sync(stamina, recovered);
  return stamina;
};

/////////////////
// TIME

export const calcIdleTime = (account: Account) => {
  return Date.now() / 1000 - account.time.last;
};

const calcStandardIdleTime = (components: Components, entityIndex: EntityIndex) => {
  const { LastActionTime } = components;
  return Date.now() / 1000 - (getComponentValue(LastActionTime, entityIndex)?.value ?? 0) * 1;
};

/////////////////
// STAMINA

// calculate the current stamina on an account as a percentage of total stamina
export const calcStaminaPercent = (stamina: Stat) => {
  return Math.floor((100 * stamina.sync) / stamina.total);
};

//////////////////
// KAMIS

// get kamis accessible to the account
export const getAccessibleKamis = (account: Account): Kami[] => {
  return account.kamis?.filter((kami) => {
    if (isDead(kami) || isResting(kami)) return true;
    if (isUnrevealed(kami) || isOffWorld(kami)) return false;
    const accLoc = account?.roomIndex ?? 0;
    const kamiLoc = kami.harvest?.node?.roomIndex ?? 0;
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
