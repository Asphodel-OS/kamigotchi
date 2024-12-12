import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { MUSU_INDEX } from 'constants/items';
import { Inventory } from 'network/shapes/Inventory';
import { getEntityByHash } from 'network/shapes/utils';

// removes MUSU, filters out empty, sorts
export const cleanInventories = (inventories: Inventory[]): Inventory[] => {
  return inventories
    .filter((inv) => !!inv && !!inv.item) // skip empty
    .filter((inv) => inv.item.index !== MUSU_INDEX) // skip musu
    .filter((inv) => (inv.balance || 0) > 0) // filter out empty
    .sort((a: Inventory, b: Inventory) => (a.item.index > b.item.index ? 1 : -1)); //sort
};

// get the entity index of an inventory by deterministic combo (holderID, itemIndex)
export const getInventoryEntityIndex = (
  world: World,
  holderID: EntityID,
  itemIndex: number
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['inventory.instance', holderID, itemIndex],
    ['string', 'uint256', 'uint32']
  );
};
