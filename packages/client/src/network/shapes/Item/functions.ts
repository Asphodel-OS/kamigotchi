import { Inventory, Is } from './types';
import { For } from './utils';

export const filterInventories = (
  inventories: Inventory[],
  is_?: keyof Is,
  for_?: keyof For,
  min = 1
): Inventory[] => {
  return inventories.filter((inv) => {
    const forMatches = for_ ? inv.item.for[for_] : true;
    const isMatches = is_ ? inv.item.is[is_] : true;
    return forMatches && isMatches && inv.balance >= min;
  });
};
