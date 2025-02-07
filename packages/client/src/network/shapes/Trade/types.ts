import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Account, getAccountByID } from '../Account';
import { getItemByIndex, Item } from '../Item';
import { getEntityByHash } from '../utils';

export interface Trade {
  id: EntityID;
  entity: EntityIndex;
  buyOrder?: TradeOrder;
  sellOrder?: TradeOrder;
  seller?: Account; // account
  buyer?: Account; // account, optional (only if specific buyer)
}

export interface TradeOrder {
  items: Item[];
  amounts: number[];
}
interface Options {
  buyOrder: boolean;
  sellOrder: boolean;
  seller: boolean;
  buyer: boolean;
}

export const getTrade = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Trade => {
  const { OwnsTradeID, TargetID } = components;

  const id = world.entities[entity];
  const sellerID = options?.seller
    ? ((getComponentValue(OwnsTradeID, entity)?.value || '') as EntityID)
    : undefined;
  const buyerID = options?.buyer
    ? (getComponentValue(TargetID, entity)?.value as EntityID)
    : undefined;

  return {
    id,
    entity,
    buyOrder: options?.buyOrder ? getBuyOrder(world, components, id) : undefined,
    sellOrder: options?.sellOrder ? getSellOrder(world, components, id) : undefined,
    seller: options?.seller && sellerID ? getAccountByID(world, components, sellerID) : undefined,
    buyer: options?.buyer && buyerID ? getAccountByID(world, components, buyerID) : undefined,
  };
};

export const getBuyOrder = (
  world: World,
  components: Components,
  tradeID: EntityID
): TradeOrder => {
  return getOrder(world, components, getBuyAnchor(world, tradeID));
};

export const getSellOrder = (
  world: World,
  components: Components,
  tradeID: EntityID
): TradeOrder => {
  return getOrder(world, components, getSellAnchor(world, tradeID));
};

const getOrder = (
  world: World,
  components: Components,
  entity: EntityIndex | undefined
): TradeOrder => {
  if (!entity) return { items: [], amounts: [] };

  const { Keys, Values } = components;
  const keys = getComponentValue(Keys, entity)?.value as number[];
  const values = getComponentValue(Values, entity)?.value as number[];

  return {
    items: keys.map((key) => getItemByIndex(world, components, key)),
    amounts: values,
  };
};

//////////////////
// IDs

export const getBuyAnchor = (world: World, tradeID: string) => {
  return getEntityByHash(world, ['trade.buy', tradeID], ['string', 'uint256']);
};

export const getSellAnchor = (world: World, tradeID: string) => {
  return getEntityByHash(world, ['trade.sell', tradeID], ['string', 'uint256']);
};
