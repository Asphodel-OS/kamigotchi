import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getItemByIndex, Item } from '../Item';
import { getEntityByHash } from '../utils';
import { getItemIndex, getValue } from '../utils/component';

export interface Receipt {
  id: EntityID;
  entity: EntityIndex;
  ObjectType: string;
  item: Item;
  amount: number;
  endTime: number;
}

// get a Receipt Object
export const getReceipt = (world: World, comps: Components, entity: EntityIndex): Receipt => {
  const { TimeEnd } = comps;

  const id = world.entities[entity];
  const receipt: Receipt = {
    id,
    entity,
    ObjectType: 'TOKEN_RECEIPT',
    item: getItemByIndex(world, comps, getItemIndex(comps, entity)),
    amount: getValue(comps, entity),
    endTime: (getComponentValue(TimeEnd, entity)?.value ?? 0) * 1,
  };

  return receipt;
};

//////////////////
// IDs

export const getBuyAnchor = (world: World, tradeID: string) => {
  return getEntityByHash(world, ['trade.buy', tradeID], ['string', 'uint256']);
};

export const getSellAnchor = (world: World, tradeID: string) => {
  return getEntityByHash(world, ['trade.sell', tradeID], ['string', 'uint256']);
};
