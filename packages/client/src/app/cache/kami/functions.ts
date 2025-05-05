import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Kami } from 'network/shapes/Kami';
import { getSourceID } from 'network/shapes/utils/component';
import { getNode } from '../node';
import { updateHarvestRate, updateHealthRate } from './calcs';
import { getKamiHarvest, getKamiTraits } from './getters';

export const updateTraits = (world: World, components: Components, kami: Kami) => {
  const traits = getKamiTraits(world, components, kami.entity);
  kami.traits = traits;
};

// NOTE: don't love this pattern. probably want to use caches here and reserve
// any object fields for actual onchain data we lazily evaluate state from.
// needs a bit of prep work to make the refactoring less painful
export const updateRates = (world: World, components: Components, kami: Kami) => {
  const harvest = getKamiHarvest(world, components, kami.entity);
  const nodeID = getSourceID(components, harvest.entity);
  const nodeEntity = world.entityToIndex.get(nodeID)!; // may cause issue if called too early
  harvest.node = getNode(world, components, nodeEntity);
  kami.harvest = harvest;

  updateTraits(world, components, kami);
  updateHarvestRate(kami); // must come before kami health rate function
  updateHealthRate(kami);
  return kami;
};
