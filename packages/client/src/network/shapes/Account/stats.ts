import { EntityIndex, World } from '@mud-classic/recs';
import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/components';
import { getData } from '../utils';

export interface Stats {
  kills: number;
  coin: number;
}

export const getStats = (world: World, components: Components, entity: EntityIndex) => {
  const id = world.entities[entity];
  return {
    kills: getData(world, components, id, 'LIQUIDATE_TOTAL', 0),
    coin: getData(world, components, id, 'ITEM_TOTAL', MUSU_INDEX),
  };
};
