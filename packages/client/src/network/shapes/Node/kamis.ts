import { EntityIndex, World } from 'engine/recs';

import { Components } from 'network/';
import { queryHarvestKami } from '../Harvest';
import { queryHarvests } from './harvests';

// query for the Kami entities with active Harvests for a given Node entity
export const queryKamis = (world: World, comps: Components, entity: EntityIndex): EntityIndex[] => {
  const harvestEntities = queryHarvests(world, comps, entity);
  const kamiEntities = harvestEntities.map((harvEntity) =>
    queryHarvestKami(world, comps, harvEntity)
  );
  return kamiEntities;
};
