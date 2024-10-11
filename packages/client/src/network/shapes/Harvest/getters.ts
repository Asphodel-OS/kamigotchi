import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Kami } from '../Kami';
import { getHarvest, getHarvestEntity, Harvest, HarvestOptions } from './types';

export const getForKami = (
  world: World,
  components: Components,
  kami: Kami,
  options?: HarvestOptions
): Harvest | undefined => {
  const entityIndex = getHarvestEntity(world, kami.id);
  if (!entityIndex) return undefined;
  return getHarvest(world, components, entityIndex, options, kami);
};
