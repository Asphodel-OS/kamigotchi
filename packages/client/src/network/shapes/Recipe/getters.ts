import { Has, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getRecipe, getRegEntity, NullRecipe, Recipe } from './types';

export const getAllRecipes = (world: World, components: Components): Recipe[] => {
  const { RecipeIndex, IsRegistry } = components;
  const entities = Array.from(runQuery([Has(RecipeIndex), Has(IsRegistry)]));
  return entities.map((index) => getRecipe(world, components, index));
};

export const getAllRecipesNoLevel = (world: World, components: Components): Recipe[] => {
  // hardcoded to hide recipes that require account levels. to update !
  return getAllRecipes(world, components).filter((recipe) => recipe.requirements.length === 0);
};

export const getRecipeByIndex = (world: World, components: Components, index: number): Recipe => {
  const entityIndex = getRegEntity(world, index);
  if (!entityIndex) return NullRecipe;

  return getRecipe(world, components, entityIndex, index);
};
