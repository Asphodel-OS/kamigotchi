import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  getConfigFieldValue,
  getConfigFieldValueAddress,
  getConfigFieldValueArray,
} from 'network/shapes/Config';

export const configs = (world: World, components: Components) => {
  return {
    get: (name: string) => getConfigFieldValue(world, components, name),
    getArray: (name: string) => getConfigFieldValueArray(world, components, name),
    getAddress: (name: string) => getConfigFieldValueAddress(world, components, name),
  };
};
