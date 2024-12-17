import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getRecipe, Recipe } from 'network/shapes/Recipe';
import { queryForAllRecipes } from 'network/shapes/Recipe/queries';

export const RecipeCache = new Map<EntityIndex, Recipe>();

export const get = (world: World, components: Components, entity: EntityIndex) => {
  if (!RecipeCache.has(entity)) process(world, components, entity);
  return RecipeCache.get(entity)!;
};

export const process = (world: World, components: Components, entity: EntityIndex) => {
  const recipe = getRecipe(world, components, entity);
  RecipeCache.set(entity, recipe);
};

export const getAll = (world: World, components: Components) => {
  return queryForAllRecipes(components).map((entity) => get(world, components, entity));
};
