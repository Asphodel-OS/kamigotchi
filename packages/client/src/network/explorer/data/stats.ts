import { World } from 'engine/recs';

import { Components } from 'network/';
import { queryAllAccounts } from 'network/shapes/Account';
import { getData } from 'network/shapes/Data';
import { getAccountIndex, getName } from 'network/shapes/utils/component';

// get the item usage stats of all accounts for a given item index
export const getItemUsage = (world: World, comps: Components, itemIndex: number) => {
  return getStats(world, comps, 'ITEM_USE', itemIndex);
};

export const getItemDrop = (world: World, comps: Components, itemIndex: number) => {
  return getStats(world, comps, 'DROPTABLE_ITEM_TOTAL', itemIndex);
};

export const getAuctionSpend = (world: World, comps: Components, itemIndex: number) => {
  return getStats(world, comps, 'ITEM_AUCTION_SPEND', itemIndex);
};

export const getAuctionBuy = (world: World, comps: Components, itemIndex: number) => {
  return getStats(world, comps, 'ITEM_AUCTION_BUY', itemIndex);
};

export const getGachaMint = (world: World, comps: Components) => {
  return getStats(world, comps, 'KAMI_GACHA_MINT', 0);
};

export const getGachaReroll = (world: World, comps: Components) => {
  return getStats(world, comps, 'KAMI_GACHA_REROLL', 0);
};

// get the data values of all accounts for a given key and index
export const getStats = (
  world: World,
  comps: Components,
  key: string,
  index: number,
  limit = 200,
  flatten = false
) => {
  const accEntities = queryAllAccounts(comps);
  const raw = accEntities.map((entity, i) => {
    const id = world.entities[entity];
    return {
      rank: i + 1,
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      value: getData(world, comps, id, key, index),
    };
  });

  const ranked = raw.sort((a, b) => b.value - a.value);
  const filtered = ranked.filter((result) => result.value > 0);
  const truncated = filtered.slice(0, limit);
  truncated.forEach((_, i) => (truncated[i].rank = i + 1));

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.value}`);
  }
  return truncated;
};
