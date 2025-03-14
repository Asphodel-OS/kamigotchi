import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Allo, getAllo } from '.';
import { queryChildrenOf } from '../utils';

export const getAllosOf = (world: World, components: Components, anchorID: EntityID): Allo[] => {
  return queryChildrenOf(components, anchorID).map((entity: EntityIndex) =>
    getAllo(world, components, entity)
  );
};
