import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getData, getDataArray } from 'network/shapes/Data';
import { onyx } from './onyx';

export const data = (world: World, components: Components) => {
  return {
    get: (id: EntityID, type: string, index?: number) =>
      getData(world, components, id, type, index),
    getArray: (id: EntityID, type: string, index?: number) =>
      getDataArray(world, components, id, type, index),
    onyx: () => onyx(world, components),
  };
};
