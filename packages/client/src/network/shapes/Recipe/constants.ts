import { EntityID, EntityIndex } from 'engine/recs';

import { Recipe } from './types';

export const NullRecipe: Recipe = {
  id: '0' as EntityID,
  index: 0,
  entity: 0 as EntityIndex,
  inputs: [],
  outputs: [],
  experience: 0,
  cost: {
    stamina: 0,
  },
  requirements: [],
};
