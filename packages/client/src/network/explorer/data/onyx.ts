import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  getOnyxRenameSpend,
  getOnyxRespecSpend,
  getOnyxReviveSpend,
  getOnyxSpends,
} from 'network/shapes/Data';

export const onyx = (world: World, comps: Components) => {
  return {
    all: () => getOnyxSpends(world, comps),
    rename: () => getOnyxRenameSpend(world, comps),
    respec: () => getOnyxRespecSpend(world, comps),
    revive: () => getOnyxReviveSpend(world, comps),
  };
};
