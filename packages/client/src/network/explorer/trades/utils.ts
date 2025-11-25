import { getTradeType } from 'app/cache/trade';
import { EntityIndex, World } from 'engine/recs';
import { Components } from 'network/components';
import { getTrade, queryTrades } from 'network/shapes/Trade';
import { TRADE_OPTIONS } from './constants';

export const get = (world: World, comps: Components, entity: EntityIndex) => {
  return getTrade(world, comps, entity, TRADE_OPTIONS);
};

export const getAll = (world: World, comps: Components) => {
  return queryTrades(comps).map((e) => get(world, comps, e));
};

export const getForState = (world: World, comps: Components, state: string) => {
  const all = getAll(world, comps);
  return all.filter((t) => t.state === state);
};

export const getByType = (world: World, comps: Components, type: string) => {
  const all = getAll(world, comps);
  return all.filter((t) => getTradeType(t) === type);
};
