import { EntityIndex, World } from '@mud-classic/recs';

import { isDead, isOffWorld, isResting, isUnrevealed } from 'app/cache/kami';
import { Components } from 'network/components';
import { Account } from 'network/shapes/Account';
import { Inventory } from 'network/shapes/Inventory';
import { Kami } from 'network/shapes/Kami';
import { Stat, getStat, sync } from 'network/shapes/Stats';
import { getLastActionTime } from 'network/shapes/utils/component';
import { getConfigValue } from '../config';

//////////////////
// INVENTORIES

export const hasFood = (account: Account): boolean => {
  const foods = account.inventories?.filter((inv) => inv.item.type === 'FOOD');
  if (!foods || foods.length == 0) return false;
  const total = foods.reduce((tot: number, inv: Inventory) => tot + (inv.balance || 0), 0);
  return total > 0;
};

//////////////////
// KAMIS

export const getAccessibleKamis = (account: Account, kamis: Kami[]): Kami[] => {
  return kamis.filter((kami) => {
    if (isDead(kami) || isResting(kami)) return true;
    if (isUnrevealed(kami) || isOffWorld(kami)) return false;
    const accLoc = account?.roomIndex ?? 0;
    const kamiLoc = kami.harvest?.node?.roomIndex ?? 0;
    return accLoc === kamiLoc;
  });
};

/////////////////
// REQUIREMENTS

/////////////////
// STAMINA

// does not include bonuses
export const getStamina = (world: World, components: Components, entity: EntityIndex): Stat => {
  const { Stamina } = components;
  const stamina = getStat(entity, Stamina);
  const recoveryPeriod = getConfigValue(world, components, 'ACCOUNT_STAMINA_RECOVERY_PERIOD');
  stamina.rate = (1 / (recoveryPeriod ?? 300)) * 1;

  // sync
  const recovered = Math.floor(calcStandardIdleTime(components, entity) * (stamina.rate ?? 0));
  stamina.sync = sync(stamina, recovered);
  return stamina;
};

// calculate the current stamina on an account as a percentage of total stamina
export const calcStaminaPercent = (stamina: Stat) => {
  if (stamina.total == 0) return 100;
  return Math.floor((100 * stamina.sync) / stamina.total);
};

/////////////////
// TIME

// calculate idle time in reference to any last action
export const calcIdleTime = (account: Account) => {
  return Date.now() / 1000 - account.time.last;
};

// calculate idle time in reference to the last standard action
// TODO: make field population robust enough to not make direct calls to components
const calcStandardIdleTime = (components: Components, entity: EntityIndex) => {
  return Date.now() / 1000 - getLastActionTime(components, entity);
};
