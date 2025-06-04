import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Account, getAccountByID } from '../Account';
import { getItemByIndex, Item } from '../Item';
import { getEntityByHash } from '../utils';
import { getOwnsTradeID, getTargetID } from '../utils/component';

export interface Trade {
  id: EntityID;
  entity: EntityIndex;
  buyOrder?: TradeOrder; // from the perspective of the maker
  sellOrder?: TradeOrder; // from the perspective of the maker
  maker?: Account; // trade creator
  taker?: Account; // optional (only if designated taker defined)
}

export interface TradeOrder {
  items: Item[];
  amounts: number[];
}
interface Options {
  buyOrder: boolean; // from the perspective of the maker
  sellOrder: boolean;
  maker: boolean;
  taker: boolean;
}

export const getTrade = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Trade => {
  const id = world.entities[entity];
  const trade: Trade = { id, entity };

  if (options?.maker) {
    const makerID = getOwnsTradeID(components, entity);
    trade.maker = getAccountByID(world, components, makerID);
  }
  if (options?.taker) {
    const takerID = getTargetID(components, entity);
    trade.taker = getAccountByID(world, components, takerID);
  }
  if (options?.buyOrder) trade.buyOrder = getBuyOrder(world, components, id);
  if (options?.sellOrder) trade.sellOrder = getSellOrder(world, components, id);

  return trade;
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
