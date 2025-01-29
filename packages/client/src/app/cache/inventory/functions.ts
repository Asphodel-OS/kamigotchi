import { MUSU_INDEX } from 'constants/items';
import { Inventory } from 'network/shapes/Inventory';

// removes MUSU, filters out empty, sorts
export const clean = (inventories: Inventory[]): Inventory[] => {
  return inventories
    .filter((inv) => !!inv && !!inv.item) // skip empty
    .filter((inv) => inv.item.index !== MUSU_INDEX) // skip musu
    .filter((inv) => (inv.balance || 0) > 0) // filter out empty
    .sort((a: Inventory, b: Inventory) => (a.item.index > b.item.index ? 1 : -1)); //sort
};

// find an inventory by its index
export const find = (inventories: Inventory[], index: number): Inventory | undefined => {
  return inventories.find((inv) => inv.item.index === index);
};

// filter a set of inventories by type, for and balance
export const filter = (
  inventories: Inventory[],
  type_?: string,
  for_?: string,
  min = 1
): Inventory[] => {
  return inventories.filter((inv) => {
    const forMatches = for_ ? inv.item.for === for_ : true;
    const isMatches = type_ ? inv.item.type === type_ : true;
    return forMatches && isMatches && inv.balance >= min;
  });
};

export const getBalance = (inventories: Inventory[], itemIndex: number): number => {
  const filtered = inventories.filter((inv) => inv.item.index == itemIndex);
  return filtered ? filtered[0]?.balance : 0;
};
