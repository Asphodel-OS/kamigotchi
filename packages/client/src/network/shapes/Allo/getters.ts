import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Allo, getAllo } from '.';
import { queryChildrenOfEntityIndex } from '../utils';

export const getAllosOf = (
  world: World,
  components: Components,
  field: string,
  index: number
): Allo[] => {
  return queryChildrenOfEntityIndex(components, field, index).map((entityIndex: EntityIndex) =>
    getAllo(world, components, entityIndex)
  );
};
