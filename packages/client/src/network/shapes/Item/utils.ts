import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { utils } from 'ethers';

import { MUSU_INDEX } from 'constants/indices';
import { formatEntityID } from 'engine/utils';
import { Inventory } from './types';

const IDStore = new Map<string, string>();

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
  let id = '';
  const key = 'inventory.instance' + holderID + itemIndex.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(
      ['string', 'uint256', 'uint32'],
      ['inventory.instance', holderID, itemIndex]
    );
  }
  return world.entityToIndex.get(formatEntityID(id));
};
