import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getBuyAnchor, getSellAnchor, getTrade, Trade } from 'network/shapes/Trade/types';

import { getAccount } from '../account';
import { getOrder } from './functions';

export const TradeCache = new Map<EntityIndex, Trade>();

export const get = (world: World, components: Components, entity: EntityIndex) => {
  const { OwnsTradeID, TargetID } = components;
  if (!TradeCache.has(entity)) {
    const trade = getTrade(world, components, entity, {
      buyOrder: false,
      sellOrder: false,
      seller: false,
      buyer: false,
    });
    TradeCache.set(entity, trade);
  }

  const trade = TradeCache.get(entity);
  const sellerID = (getComponentValue(OwnsTradeID, entity)?.value || '') as EntityID;
  const buyerID = getComponentValue(TargetID, entity)?.value as EntityID;
  const buyOrder = getOrder(world, components, getBuyAnchor(world, trade?.id!));
  const sellOrder = getOrder(world, components, getSellAnchor(world, trade?.id!));

  return {
    id: trade?.id!,
    entity,
    buyOrder: buyOrder,
    sellOrder: sellOrder,
    seller: getAccount(world, components, world.entityToIndex.get(sellerID!)!),
    buyer: getAccount(world, components, world.entityToIndex.get(buyerID!)!),
  };
};
