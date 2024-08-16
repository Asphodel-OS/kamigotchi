import { World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getReputationValue } from '../Faction';
import { getMusuBalance } from '../Item';
import { queryAll } from './queries';

// return the ranked reputation values of all accounts
export const getReputationRankings = (
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
      reputation: getReputationValue(world, components, id, 1), // get agency rep
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
export const getMusuRankings = (
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
      coin: getMusuBalance(world, components, id),
    };
  });

  // sort and filter
  const ranked = raw.sort((a, b) => b.coin - a.coin);
  const truncated = ranked.slice(0, limit ?? raw.length);

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, ranking) => `${ranking + 1}. ${result.name}: ${result.coin}`);
  }
  return truncated;
};
