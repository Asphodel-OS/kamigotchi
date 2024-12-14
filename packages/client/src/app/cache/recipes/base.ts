import { EntityIndex, Has, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getRecipe, Recipe } from 'network/shapes/Recipe';

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
  const { RecipeIndex, IsRegistry } = components;
  const entities = Array.from(runQuery([Has(RecipeIndex), Has(IsRegistry)]));
  console.log(`entities.length ${JSON.stringify(entities)}`);
  const result = entities.map((entity) => get(world, components, entity));
  console.log(`result.length ${JSON.stringify(result)}`);
  return result;
};
