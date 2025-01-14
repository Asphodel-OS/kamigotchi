import { World, getComponentValue } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/';
import { queryAll } from '../../shapes/Account/queries';
import { getData } from '../../shapes/Data';
import { getReputation } from '../../shapes/Faction';
import { getItemBalance } from '../../shapes/Item';

// return the total coin collected stats of all accounts
export const getCoinStats = (world: World, components: Components, limit = 200, flatten = true) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getComponentValue(AccountIndex, entity)?.value as number,
      name: getComponentValue(Name, entity)?.value as string,
      coin: getData(world, components, id, 'ITEM_TOTAL', MUSU_INDEX),
    };
  });
  const ranked = raw.sort((a, b) => b.coin - a.coin);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, ranking) => `${ranking + 1}. ${result.name}: ${result.coin}`);
  }
  return truncated;
};

// return the ranked item balances of all accounts
export const getItemStats = (
  world: World,
  components: Components,
  index = 1,
  limit = 200,
  flatten = true
) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getComponentValue(AccountIndex, entity)?.value as number,
      name: getComponentValue(Name, entity)?.value as string,
      amt: getItemBalance(world, components, id, index),
    };
  });

  // sort and filter
  const ranked = raw.sort((a, b) => b.amt - a.amt);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, ranking) => `${ranking + 1}. ${result.name}: ${result.amt}`);
  }
  return truncated;
};

// return the kill stats of all accounts
export const getKillStats = (world: World, components: Components, limit = 200, flatten = true) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getComponentValue(AccountIndex, entity)?.value as number,
      name: getComponentValue(Name, entity)?.value as string,
      kills: getData(world, components, id, 'LIQUIDATE_TOTAL', 0),
    };
  });
  const ranked = raw.sort((a, b) => b.kills - a.kills);
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, ranking) => `${ranking + 1}. ${result.name}: ${result.kills}`);
  }
  return truncated;
};

// arbitrary stats function
export const getOverallStats = (world: World, components: Components, limit = 200) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities
    .map((entity) => {
      const id = world.entities[entity];
      return {
        index: getComponentValue(AccountIndex, entity)?.value as number,
        name: getComponentValue(Name, entity)?.value as string,
        rep: getReputation(world, components, id, 1),
        musu: getItemBalance(world, components, id, 1),
        stone: getItemBalance(world, components, id, 11002),
        stick: getItemBalance(world, components, id, 11006),
      };
    })
    .filter((result) => result.rep < 300);

  // sort and filter
  const ranked = raw.sort((a, b) => b.rep - a.rep);
  const truncated = ranked.slice(0, limit);
  return truncated;
};

// return the ranked reputation values of all accounts
export const getReputationStats = (
  world: World,
  components: Components,
  limit?: number,
  flatten = true
) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities.map((entity) => {
    const id = world.entities[entity];
    return {
      index: getComponentValue(AccountIndex, entity)?.value as number,
      name: getComponentValue(Name, entity)?.value as string,
      reputation: getReputation(world, components, id, 1), // get agency rep
    };
  });

  // sort and filter
  const ranked = raw.sort((a, b) => {
    const diff = b.reputation - a.reputation;
    return diff != 0 ? diff : a.name.localeCompare(b.name);
  });
  const truncated = ranked.slice(0, limit);

  // optionally flatten and return
  if (flatten) {
    return truncated.map(
      (result, ranking) => `${ranking + 1}. ${result.name}: ${result.reputation}`
    );
  }
  return truncated;
};
