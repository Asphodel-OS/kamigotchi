import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getItemBalance } from '../Item';
import { Recipe } from './types';

export const haveIngredients = (
  world: World,
  components: Components,
  recipe: Recipe,
  accID: EntityID
): boolean => {
  return recipe.inputs.every(
    (ing) => getItemBalance(world, components, accID, ing.index) >= ing.amount
  );
};
