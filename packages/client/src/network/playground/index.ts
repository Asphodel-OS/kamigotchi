import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { AccountOptions, getAllAccounts } from 'network/shapes/Account';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  return {
    all: (options?: AccountOptions) => getAllAccounts(world, components, options),
  };
};
