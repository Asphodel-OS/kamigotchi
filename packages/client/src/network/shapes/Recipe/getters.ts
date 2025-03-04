import { Has, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { NullRecipe } from './constants';
import { getRecipe, getRegEntity, Recipe } from './types';

export const getAllRecipes = (world: World, components: Components): Recipe[] => {
  const { RecipeIndex, IsRegistry } = components;
  const entities = Array.from(runQuery([Has(RecipeIndex), Has(IsRegistry)]));
  return entities.map((index) => getRecipe(world, components, index));
};

export const getRecipeByIndex = (world: World, components: Components, index: number): Recipe => {
  const entity = getRegEntity(world, index);
  if (!entity) return NullRecipe;

  return getRecipe(world, components, entity, index);
};
