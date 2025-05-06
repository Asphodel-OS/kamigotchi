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

export const getStats = (world: World, comps: Components, entity: EntityIndex) => {
  const id = world.entities[entity];
  const now = Date.now() / 1000;
  const stageInfo = getConfigFieldValueArray(world, comps, 'VIP_STAGE');
  const start = stageInfo[0];
  const epochDuration = stageInfo[1];
  const stage = Math.floor((now - start) / epochDuration + 1);
  return {
    kills: getData(world, comps, id, 'LIQUIDATE_TOTAL', 0),
    coin: getData(world, comps, id, 'ITEM_TOTAL', MUSU_INDEX),
    vip: getScoreFromHash(world, comps, id, stage, 0, 'VIP_SCORE').value,
  };
};
