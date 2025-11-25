import { World } from 'engine/recs';

import { Trade as TradeHistory } from 'clients/kamiden/proto';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/components';
import { getAccountByID } from '../Account';
import { getItemByIndex } from '../Item';
import { getEntityType } from '../utils/component';
import { Trade } from './types';

interface Options {
  buyOrder: boolean; // from the perspective of the maker
  sellOrder: boolean;
  maker: boolean;
  taker: boolean;
}
export type State = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'COMPLETED';
export type Timestamp = Record<State, string>;

export const getTradeHistory = (
  world: World,
  comps: Components,
  tradeHistory: TradeHistory,
  options?: Options
): Trade => {
  const id = formatEntityID(tradeHistory.TradeId);

  const tradeEntity = world.entityToIndex.get(id)!;
  const trade: Trade = {
    id,
    entity: tradeEntity,
    ObjectType: getEntityType(comps, tradeEntity),
    state: getTradeHistoryState(comps, tradeHistory) as State,
    timestamps: getTradeHistoryState(comps, tradeHistory, true) as Timestamp,
  };

  if (options?.maker) {
    const makerID = formatEntityID(tradeHistory.MakerId);
    trade.maker = getAccountByID(world, comps, makerID);
  }

  if (options?.taker) {
    const takerID = formatEntityID(tradeHistory.TakerId);
    trade.taker = getAccountByID(world, comps, takerID);
  }

  if (options?.buyOrder)
    trade.buyOrder = {
      items: tradeHistory.BuyOrderIndices.map((key) => getItemByIndex(world, comps, key)),
      amounts: tradeHistory.BuyOrderAmounts.map(Number),
    };

  if (options?.sellOrder)
    trade.sellOrder = {
      items: tradeHistory.SellOrderIndices.map((key) => getItemByIndex(world, comps, key)),
      amounts: tradeHistory.SellOrderAmounts.map(Number),
    };

  return trade;
};

export const getTradeHistoryState = (
  components: Components,
  tradeHistory: TradeHistory,
  timestamp: boolean = false
): State | Timestamp => {
  if (timestamp) {
    return {
      PENDING: tradeHistory.CreateTimestamp,
      CANCELLED: tradeHistory.CancelTimestamp,
      COMPLETED: tradeHistory.CompleteTimestamp,
      EXECUTED: tradeHistory.ExecuteTimestamp,
    };
  } else {
    let result: State;
    if (tradeHistory.CancelTimestamp !== '0') {
      result = 'CANCELLED';
    } else if (tradeHistory.CompleteTimestamp !== '0') {
      result = 'COMPLETED';
    } else {
      result = 'EXECUTED';
    }
    return result;
  }
};
