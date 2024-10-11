import { HasValue, World } from '@mud-classic/recs';

import { Has, runQuery } from '@mud-classic/recs';
import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';

// playground for whatever local queries
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  const { IsInventory, ItemIndex } = components;

  const allInventories = () => {
    const toQuery = [Has(IsInventory), HasValue(ItemIndex, { value: 2 })];
    return Array.from(runQuery(toQuery));
  };

  return {
    all: () => allInventories(),
  };
};
