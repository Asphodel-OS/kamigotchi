import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getHarvest as getHarvestShape, Harvest } from '../Harvest';
import { getEntityByHash } from '../utils';

// query the Harvest entity for a Kami entity
export const queryHarvest = (world: World, entity: EntityIndex) => {
  const id = world.entities[entity];
  return getEntityByHash(world, ['harvest', id], ['string', 'uint256']);
};

// get the Harvest object for a Kami entity
export const getHarvest = (
  world: World,
  components: Components,
  entity: EntityIndex // kami entity index
): Harvest | undefined => {
  const harvestEntity = queryHarvest(world, entity);
  if (!harvestEntity) return undefined;
  return getHarvestShape(world, components, harvestEntity, { node: true });
};
