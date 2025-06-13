import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getBuyAnchor, getSellAnchor, getTrade, Trade, TradeState } from 'network/shapes/Trade';
import { getOwnsTradeID, getState, getTargetID } from 'network/shapes/utils/component';
import { getAccount } from '../account';
import { getOrder } from './helpers';

export const TradeCache = new Map<EntityIndex, Trade>();
const StateUpdateTs = new Map<EntityIndex, number>();
const TakerUpdateTs = new Map<EntityIndex, number>();

/// process all static data on for a Trade
export const process = (world: World, comps: Components, entity: EntityIndex) => {
  const trade = getTrade(world, comps, entity);

  //set maker
  const makerID = getOwnsTradeID(comps, entity);
  trade.maker = getAccount(world, comps, world.entityToIndex.get(makerID)!);

  // set taker if defined
  const takerID = getTargetID(comps, entity, false);
  if (takerID) trade.taker = getAccount(world, comps, world.entityToIndex.get(takerID)!);

  // set order data
  trade.buyOrder = getOrder(world, comps, getBuyAnchor(world, trade.id));
  trade.sellOrder = getOrder(world, comps, getSellAnchor(world, trade.id));
  TradeCache.set(entity, trade);
};

export interface RefreshOptions {
  state?: number;
  taker?: number;
}

// get a Trade from the cache and optionally update any changing data
export const get = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  options?: RefreshOptions
): Trade => {
  if (!TradeCache.has(entity)) process(world, comps, entity);
  const trade = TradeCache.get(entity)!;
  if (!options) return trade;

  const now = Date.now();

  // set participants
  if (options.state != undefined) {
    const updateTs = StateUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.state) {
      trade.state = getState(comps, entity) as TradeState;
      StateUpdateTs.set(entity, now);
    }
  }

  if (options.taker != undefined) {
    const updateTs = TakerUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.taker) {
      const takerID = getTargetID(comps, entity, false);
      if (takerID) trade.taker = getAccount(world, comps, world.entityToIndex.get(takerID)!);
      TakerUpdateTs.set(entity, now);
    }
  }

  return trade;
};
