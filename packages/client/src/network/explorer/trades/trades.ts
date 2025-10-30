import { EntityIndex, World } from 'engine/recs';
import { Components } from 'network/components';
import { get, getAll, getByType } from './utils';

export const trades = (world: World, comps: Components) => {
  return {
    all: () => getAll(world, comps),
    allForType: (type: string) => getByType(world, comps, type),
    get: (entity: EntityIndex) => get(world, comps, entity),
  };
};
