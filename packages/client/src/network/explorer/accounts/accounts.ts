import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  AccountOptions,
  getAccount,
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
  getKamiCounts,
  getKillStats,
  getOverallStats,
  getReputationStats,
} from './stats';

const FullAccountOptions: AccountOptions = {
  kamis: true,
  friends: true,
  inventory: true,
  stats: true,
};

export const accounts = (world: World, components: Components) => {
  return {
    all: (options?: AccountOptions) => getAllAccounts(world, components, options),
    get: (entity: EntityIndex, options?: AccountOptions) =>
      getAccount(world, components, entity, options ?? FullAccountOptions),
    getByIndex: (index: number, options?: AccountOptions) =>
      getAccountByIndex(world, components, index, options ?? FullAccountOptions),
    getByID: (id: EntityID, options?: AccountOptions) =>
      getAccountByID(world, components, id, options ?? FullAccountOptions),
    getByOwner: (owner: string, options?: AccountOptions) =>
      getAccountByOwner(world, components, owner.toLowerCase(), options ?? FullAccountOptions),
    getByOperator: (operator: string, options?: AccountOptions) =>
      getAccountByOperator(
        world,
        components,
        operator.toLowerCase(),
        options ?? FullAccountOptions
      ),
    getByName: (name: string, options?: AccountOptions) =>
      getAccountByName(world, components, name, options ?? FullAccountOptions),
    indices: () => Array.from(components.AccountIndex.values.value.values()),
    rankings: {
      item: (index: number, limit?: number) => getItemStats(world, components, index, limit),
      kami: (limit?: number) => getKamiCounts(world, components, limit),
      musu: (limit?: number) => getItemStats(world, components, 1, limit),
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
