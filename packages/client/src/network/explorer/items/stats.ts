import { World } from 'engine/recs';

import { getInventoryBalance } from 'app/cache/inventory';
import { Components } from 'network/';
import { queryAllAccounts } from 'network/shapes/Account';
import { getInventory, queryInventories } from 'network/shapes/Inventory';
import { getAccountIndex, getName } from 'network/shapes/utils/component';

// gets the inventory balances of all accounts for a given item index
export const getWorldBalances = (
  world: World,
  comps: Components,
  index: number,
  limit = 200,
  flatten = false
) => {
  const entities = queryAllAccounts(comps);
  const raw = entities.map((entity, i) => {
    const id = world.entities[entity];
    const invEntities = queryInventories(comps, { owner: id });
    const inventories = invEntities.map((e) => getInventory(world, comps, e));
    const balance = getInventoryBalance(inventories, index);

    return {
      rank: i + 1,
      index: getAccountIndex(comps, entity),
      name: getName(comps, entity),
      balance,
    };
  });
  const ranked = raw.sort((a, b) => b.balance - a.balance);
  const filtered = ranked.filter((result) => result.balance > 0);
  const truncated = filtered.slice(0, limit);
  truncated.forEach((_, i) => (truncated[i].rank = i + 1));

  // optionally flatten and return
  if (flatten) {
    return truncated.map((result, i) => `${i + 1}. ${result.name}: ${result.balance}`);
  }
  return truncated;
};
