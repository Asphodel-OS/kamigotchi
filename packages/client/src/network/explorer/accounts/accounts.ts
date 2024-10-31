import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  AccountOptions,
  getAccountByID,
  getAccountByIndex,
  getAccountByName,
  getAccountByOperator,
  getAccountByOwner,
  getAllAccounts,
} from 'network/shapes/Account';
import {
  getCoinStats,
  getItemStats,
  getKillStats,
  getOverallStats,
  getReputationStats,
} from './stats';

const fullAccountOptions: AccountOptions = {
  kamis: true,
  friends: true,
  inventory: true,
  stats: true,
};

export const accounts = (world: World, components: Components) => {
  return {
    all: (options?: AccountOptions) => getAllAccounts(world, components, options),
    get: (index: number) => getAccountByIndex(world, components, index, fullAccountOptions),
    getByID: (id: EntityID) => getAccountByID(world, components, id, fullAccountOptions),
    getByOwner: (owner: string) =>
      getAccountByOwner(world, components, owner.toLowerCase(), fullAccountOptions),
    getByOperator: (operator: string) =>
      getAccountByOperator(world, components, operator.toLowerCase(), fullAccountOptions),
    getByName: (name: string) => getAccountByName(world, components, name, fullAccountOptions),
    indices: () => Array.from(components.AccountIndex.values.value.values()),
    rankings: {
      musu: (limit?: number) => getItemStats(world, components, limit),
      reputation: (limit?: number) => getReputationStats(world, components, limit),
    },
    stats: {
      coin: (limit?: number) => getCoinStats(world, components, limit),
      item: (index?: number, limit?: number) => getItemStats(world, components, index, limit),
      kill: (limit?: number) => getKillStats(world, components, limit),
      musu: (limit?: number) => getItemStats(world, components, 1, limit),
      rep: (limit?: number) => getReputationStats(world, components, limit),
      overall: (limit?: number) => getOverallStats(world, components, limit),
    },
  };
};
