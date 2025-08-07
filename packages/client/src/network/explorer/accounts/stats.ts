import { World } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/';
import { getAccountKamis, queryAllAccounts } from 'network/shapes/Account';
import { getData } from 'network/shapes/Data';
import { getReputation } from 'network/shapes/Faction';
import { getItemBalance } from 'network/shapes/Item';
import { getScoreFromHash, getVIPEpoch } from 'network/shapes/Score';
import { getAccountIndex, getName } from 'network/shapes/utils/component';

export const getKamiCounts = (world: World, comps: Components, limit = 200, flatten = false) => {
  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity, i) => {
    return {
      rank: i + 1,
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      count: getAccountKamis(world, comps, entity),
    };
  });
  const ranked = raw.sort((a, b) => b.count.length - a.count.length);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.count}`);
  }
  return truncated;
};

// return the total coin collected stats of all accounts
export const getCoinStats = (world: World, comps: Components, limit = 200, flatten = false) => {
  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity, i) => {
    const id = world.entities[entity];
    return {
      rank: i + 1,
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      coin: getData(world, comps, id, 'ITEM_TOTAL', MUSU_INDEX),
    };
  });

  // sort and truncate
  const ranked = raw.sort((a, b) => b.coin - a.coin);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.coin}`);
  }
  return truncated;
};

// return the ranked item balances of all accounts
export const getItemStats = (
  world: World,
  comps: Components,
  index = 1,
  limit = 200,
  flatten = false
) => {
  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity, i) => {
    const id = world.entities[entity];
    return {
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      amt: getItemBalance(world, comps, id, index),
    };
  });

  // sort and truncate
  const ranked = raw.sort((a, b) => b.amt - a.amt);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.amt}`);
  }
  return truncated;
};

// return the kill stats of all accounts
export const getKillStats = (world: World, comps: Components, limit = 200, flatten = true) => {
  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      kills: getData(world, comps, id, 'LIQUIDATE_TOTAL', 0),
    };
  });
  const ranked = raw.sort((a, b) => b.kills - a.kills);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.kills}`);
  }
  return truncated;
};

// arbitrary stats function
export const getOverallStats = (world: World, comps: Components, limit = 200) => {
  const entities = queryAllAccounts(comps);
  const raw = entities
    .map((entity) => {
      const id = world.entities[entity];
      return {
        index: getAccountIndex(comps, entity),
        name: getName(comps, entity),
        rep: getReputation(world, comps, id, 1),
        musu: getItemBalance(world, comps, id, 1),
        stone: getItemBalance(world, comps, id, 11002),
        stick: getItemBalance(world, comps, id, 11006),
      };
    })
    .filter((result) => result.rep < 300);

  // sort and truncate
  const ranked = raw.sort((a, b) => b.rep - a.rep);
  const truncated = ranked.slice(0, limit);
  return truncated;
};

// return the ranked reputation values of all accounts
export const getReputationStats = (
  world: World,
  comps: Components,
  limit?: number,
  flatten = true
) => {
  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      reputation: getReputation(world, comps, id, 1), // get agency rep
    };
  });

  // sort and truncate
  const ranked = raw.sort((a, b) => {
    const diff = b.reputation - a.reputation;
    return diff != 0 ? diff : a.name.localeCompare(b.name);
  });
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.reputation}`);
  }
  return truncated;
};

export const getVipStats = (world: World, comps: Components, epoch?: number, limit?: number) => {
  if (!epoch) epoch = getVIPEpoch(world, comps);

  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      vip: getScoreFromHash(world, comps, id, epoch, 0, 'VIP_SCORE').value,
    };
  });
  const ranked = raw.sort((a, b) => b.vip - a.vip);
  const truncated = ranked.slice(0, limit ?? 200);
  return truncated;
};
