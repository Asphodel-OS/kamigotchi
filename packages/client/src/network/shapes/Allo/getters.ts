import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Allo, getAllo } from '.';
import { queryChildrenOf } from '../utils';

export const getAllosOf = (world: World, components: Components, parentID: EntityID): Allo[] => {
  return queryChildrenOf(components, parentID).map((entity: EntityIndex) =>
    getAllo(world, components, entity)
  );
};
