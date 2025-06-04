import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getBuyAnchor, getSellAnchor, getTrade, Trade } from 'network/shapes/Trade';
import { getOwnsTradeID } from 'network/shapes/utils/component';
import { getAccount } from '../account';
import { getOrder } from './functions';

export const TradeCache = new Map<EntityIndex, Trade>();

export const get = (world: World, comps: Components, entity: EntityIndex): Trade => {
  if (!TradeCache.has(entity)) {
    const trade = getTrade(world, comps, entity, {
      buyOrder: false,
      sellOrder: false,
      maker: false,
      taker: false,
    });
    TradeCache.set(entity, trade);
  }

  const trade = TradeCache.get(entity);
  const makerID = getOwnsTradeID(comps, entity);
  // const takerID = getTargetID(comps, entity);
  const buyOrder = getOrder(world, comps, getBuyAnchor(world, trade?.id!));
  const sellOrder = getOrder(world, comps, getSellAnchor(world, trade?.id!));

  return {
    id: trade?.id!,
    entity,
    buyOrder: buyOrder,
    sellOrder: sellOrder,
    maker: getAccount(world, comps, world.entityToIndex.get(makerID!)!),
    // taker: getAccount(world, comps, world.entityToIndex.get(takerID!)!),
  };
};
