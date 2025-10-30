import { EntityID, World } from 'engine/recs';

import { Trade as TradeHistory } from 'clients/kamiden/proto';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import {
  getTradeHistory,
  getTradeHistoryState,
  State,
  Timestamp,
  Trade,
} from 'network/shapes/Trade';
import { HistoryUpdated, TradeCache } from './base';

// Non live trades
export const processHistory = (
  world: World,
  comps: Components,
  tradeHistory: TradeHistory,
  id: EntityID
) => {
  let trade: Trade;
  // if the trade is already in the cache, update the state
  if (TradeCache.has(id)) {
    trade = TradeCache.get(id)!;
    trade.state = getTradeHistoryState(comps, tradeHistory) as State;
    trade.timestamps = getTradeHistoryState(comps, tradeHistory, true) as Timestamp;
    // if the trade is not in the cache, create a new one
  } else {
    trade = getTradeHistory(world, comps, tradeHistory, {
      maker: true,
      taker: true,
      buyOrder: true,
      sellOrder: true,
    });
  }

  TradeCache.set(id, trade);
  HistoryUpdated.add(id);
};

// manages non live trades
export const getHistory = (world: World, comps: Components, tradeHistory: TradeHistory): Trade => {
  const id: EntityID = formatEntityID(tradeHistory.TradeId);
  if (!HistoryUpdated.has(id)) {
    processHistory(world, comps, tradeHistory, id);
  }
  const trade = TradeCache.get(id)!;
  // history trades don’t need to periodically update state and taker
  return trade;
};
