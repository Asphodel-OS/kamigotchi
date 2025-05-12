import { World } from '@mud-classic/recs';
import { isDead, isOffWorld, isResting, isUnrevealed } from 'app/cache/kami';
import { Components } from 'network/components';
import { Account } from 'network/shapes/Account';
import { queryAll } from 'network/shapes/Account/queries';
import { Inventory } from 'network/shapes/Inventory';
import { Kami } from 'network/shapes/Kami';
import { get } from './base';

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

//////////////////
// GET ALL ACCOUNTS

export const getAll = (world: World, components: Components) => {
  const entities = queryAll(components);
  return entities.map((entity) => get(world, components, entity));
};
