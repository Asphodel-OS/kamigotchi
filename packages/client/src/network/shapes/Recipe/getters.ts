import { Has, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getRecipe, getRegEntity, NullRecipe, Recipe } from './types';

export const getAllRecipes = (world: World, components: Components): Recipe[] => {
  const { RecipeIndex, IsRegistry } = components;
  const entities = Array.from(runQuery([Has(RecipeIndex), Has(IsRegistry)]));
  return entities.map((index) => getRecipe(world, components, index));
};

export const getRecipeByIndex = (world: World, components: Components, index: number): Recipe => {
  const entityIndex = getRegEntity(world, index);
  if (!entityIndex) return NullRecipe;

  return getRecipe(world, components, entityIndex, index);
};
