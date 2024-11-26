import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Allo, getAllo } from '.';
import { queryChildrenOf } from '../utils';

export const getAllosOf = (world: World, components: Components, entityID: EntityID): Allo[] => {
  return queryChildrenOf(components, entityID).map((entityIndex: EntityIndex) =>
    getAllo(world, components, entityIndex)
  );
};
