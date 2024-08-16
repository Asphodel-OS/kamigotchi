import { EntityID, World, getComponentValue } from '@mud-classic/recs';
import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/index';
import { Inventory, Is } from './types';
import { getInventoryEntityIndex } from './utils';

/////////////////
// GETTERS

export const getMusuBalance = (
  world: World,
  components: Components,
  holderID: EntityID
): number => {
  return getItemBalance(world, components, holderID, MUSU_INDEX);
};

export const getItemBalance = (
  world: World,
  components: Components,
  holderID: EntityID,
  itemIndex: number
): number => {
  const { Value } = components;
  const entityIndex = getInventoryEntityIndex(world, holderID ?? 0, itemIndex);
  return entityIndex ? (getComponentValue(Value, entityIndex)?.value ?? 0) * 1 : 0;
};

////////////////
// UTILS

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
