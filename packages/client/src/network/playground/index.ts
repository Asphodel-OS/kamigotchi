import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { getAllAccounts } from 'network/shapes/Account';

// playground for whatever local queries
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  return {
    all: () => getAllAccounts(world, components),
  };
};
