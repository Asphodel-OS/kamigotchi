import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';
import { utils } from 'ethers';

import { MUSU_INDEX } from 'constants/indices';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/components';
import { Inventory } from './types';

const IDStore = new Map<string, string>();
const forAccount = utils.solidityKeccak256(['string'], ['component.is.account']);
const forKami = utils.solidityKeccak256(['string'], ['component.is.pet']);

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

export interface For {
  account: boolean;
  kami: boolean;
}

export const getFor = (components: Components, entityIndex: EntityIndex): For => {
  const { For } = components;

  const rawValue = getComponentValue(For, entityIndex)?.value;
  if (!rawValue) return { account: false, kami: false };
  const value = rawValue.toString();

  return {
    account: value === forAccount,
    kami: value === forKami,
  };
};
