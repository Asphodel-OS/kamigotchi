import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllRecipes, getRecipe, getRecipeByIndex } from 'network/shapes/Recipe';

export const recipes = (world: World, components: Components) => {
  return {
    all: () => getAllRecipes(world, components),
    get: (entity: EntityIndex) => getRecipe(world, components, entity),
    getByIndex: (index: number) => getRecipeByIndex(world, components, index),
    indices: () => Array.from(components.RecipeIndex.values.value.values()),
  };
};
