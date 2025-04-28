import { EntityIndex, World } from '@mud-classic/recs';
import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/components';
import { getConfigFieldValueArray } from '../Config';
import { getData } from '../Data';
import { getScoreFromHash } from '../Score';

export interface Stats {
  kills: number;
  coin: number;
  vip: number;
}

export const getStats = (world: World, components: Components, entity: EntityIndex) => {
  const id = world.entities[entity];
  const stageInfo = getConfigFieldValueArray(world, components, 'VIP_STAGE');
  const stage = Math.trunc((Date.now() - stageInfo[0]) / stageInfo[1] + 1);
  return {
    kills: getData(world, components, id, 'LIQUIDATE_TOTAL', 0),
    coin: getData(world, components, id, 'ITEM_TOTAL', MUSU_INDEX),
    vip: getScoreFromHash(world, components, id, stage, 0, 'VIP_SCORE').score,
  };
};
