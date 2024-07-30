import { Inventory, Is } from './types';

export const filterInventories = (
  inventories: Inventory[],
  is_?: keyof Is,
  for_?: string,
  min = 1
): Inventory[] => {
  return inventories.filter((inv) => {
    const forMatches = for_ ? inv.item.for === for_ : true;
    const isMatches = is_ ? inv.item.is[is_] : true;
    return forMatches && isMatches && inv.balance >= min;
  });
};
