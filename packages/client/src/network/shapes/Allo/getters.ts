import { EntityID, EntityIndex, World } from 'engine/recs';

import { Components } from 'network/';
import { Allo, getAllo } from '.';
import { queryChildrenOf } from '../utils';

export const getAllosOf = (world: World, comps: Components, anchorID: EntityID): Allo[] => {
  const childEntities = queryChildrenOf(comps, anchorID);
  return childEntities.map((entity: EntityIndex) => getAllo(world, comps, entity));
};
