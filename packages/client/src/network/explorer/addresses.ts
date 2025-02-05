import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getCompAddr, getSystemAddr } from 'network/shapes/utils/addresses';

export const addresses = (world: World, components: Components) => {
  return {
    components: (id: string) => getCompAddr(world, components, id),
    systems: (id: string) => getSystemAddr(world, components, id),
  };
};
