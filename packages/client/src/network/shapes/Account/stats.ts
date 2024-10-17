import { World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getReputation } from '../Faction';
import { getItemBalance } from '../Item';
import { queryAll } from './queries';

// return the ranked reputation values of all accounts
export const getReputationStats = (
  world: World,
  components: Components,
  limit?: number,
  flatten = true
) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities.map((entityIndex) => {
    const id = world.entities[entityIndex];
    return {
      index: getComponentValue(AccountIndex, entityIndex)?.value as number,
      name: getComponentValue(Name, entityIndex)?.value as string,
      reputation: getReputation(world, components, id, 1), // get agency rep
    };
  });

  // sort and filter
  const ranked = raw.sort((a, b) => {
    const diff = b.reputation - a.reputation;
    return diff != 0 ? diff : a.name.localeCompare(b.name);
  });
  const truncated = ranked.slice(0, limit ?? raw.length);

  // optionally flatten and return
  if (flatten) {
    return truncated.map(
      (result, ranking) => `${ranking + 1}. ${result.name}: ${result.reputation}`
    );
  }
  return truncated;
};

// return the ranked musu balances of all accounts
export const getItemStats = (
  world: World,
  components: Components,
  index = 1,
  limit = 200,
  flatten = true
) => {
  const { AccountIndex, Name } = components;
  const entities = queryAll(components);
  const raw = entities.map((entityIndex) => {
    const id = world.entities[entityIndex];
    return {
      index: getComponentValue(AccountIndex, entityIndex)?.value as number,
      name: getComponentValue(Name, entityIndex)?.value as string,
      amt: getItemBalance(world, components, id, index),
    };
  });

  // sort and filter
  const ranked = raw.sort((a, b) => b.amt - a.amt);
  const truncated = ranked.slice(0, limit ?? raw.length);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, ranking) => `${ranking + 1}. ${result.name}: ${result.amt}`);
  }
  return truncated;
};
