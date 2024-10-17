import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  AccountOptions,
  getAccountByID,
  getAccountByIndex,
  getAccountByName,
  getAccountByOwner,
  getAccountItemStats,
  getAccountRepStats,
  getAllAccounts,
} from 'network/shapes/Account';
import { getByOperator } from 'network/shapes/Account/getters';

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
      getByOperator(world, components, operator.toLowerCase(), fullAccountOptions),
    getByName: (name: string) => getAccountByName(world, components, name, fullAccountOptions),
    entities: () => Array.from(components.IsAccount.entities()),
    indices: () => Array.from(components.AccountIndex.values.value.values()),
    rankings: {
      musu: (limit?: number) => getAccountItemStats(world, components, limit),
      reputation: (limit?: number) => getAccountRepStats(world, components, limit),
    },
    stats: {
      item: (index?: number, limit?: number) =>
        getAccountItemStats(world, components, index, limit),
      musu: (limit?: number) => getAccountItemStats(world, components, limit),
      reputation: (limit?: number) => getAccountRepStats(world, components, limit),
    },
  };
};
