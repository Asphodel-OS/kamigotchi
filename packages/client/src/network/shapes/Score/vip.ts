import { World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getConfigFieldValueArray } from '../Config';

// get the current vip epoch
export const getEpoch = (world: World, comps: Components): number => {
  const now = Date.now() / 1000;
  const stageInfo = getConfigFieldValueArray(world, comps, 'VIP_STAGE');
  const start = stageInfo[0];
  const epochDuration = stageInfo[1];
  return Math.floor((now - start) / epochDuration + 1);
};
