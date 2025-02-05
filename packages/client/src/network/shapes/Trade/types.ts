import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Account, getAccountByID } from '../Account';
import { getItemByIndex, Item } from '../Item';
import { getEntityByHash } from '../utils';

export interface Trade {
  id: EntityID;
  entity: EntityIndex;
  buyOrder: TradeOrder;
  sellOrder: TradeOrder;
  seller: Account; // account
  buyer?: Account; // account, optional (only if specific buyer)
}

export interface TradeOrder {
  items: Item[];
  amounts: number[];
}

export const getTrade = (world: World, components: Components, entity: EntityIndex): Trade => {
  const { OwnsTradeID, TargetID } = components;

  const id = world.entities[entity];
  const sellerID = (getComponentValue(OwnsTradeID, entity)?.value || '') as EntityID;
  const buyerID = getComponentValue(TargetID, entity)?.value as EntityID;

  return {
    id,
    entity,
    buyOrder: getBuyOrder(world, components, id),
    sellOrder: getSellOrder(world, components, id),
    seller: getAccountByID(world, components, sellerID),
    buyer: buyerID ? getAccountByID(world, components, buyerID) : undefined,
  };
};

const getBuyOrder = (world: World, components: Components, tradeID: EntityID): TradeOrder => {
  return getOrder(world, components, getBuyAnchor(world, tradeID));
};

const getSellOrder = (world: World, components: Components, tradeID: EntityID): TradeOrder => {
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

const getBuyAnchor = (world: World, tradeID: string) => {
  return getEntityByHash(world, ['trade.buy', tradeID], ['string', 'uint256']);
};

const getSellAnchor = (world: World, tradeID: string) => {
  return getEntityByHash(world, ['trade.sell', tradeID], ['string', 'uint256']);
};
