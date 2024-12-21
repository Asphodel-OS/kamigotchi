import { Has, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getRecipe, getRegEntity, NullRecipe, Recipe } from './types';

/* note: this is not functional now

// all npcs recipes
export const getByNpc = (world: World, components: Components, entity: EntityIndex): Recipe[] => {
  const results = queryForRecipebyNpc(components, entity);
  return results.map((recipe) =>
    getRecipe(world, components, recipe, getIndex(components, recipe))
  );
};

// all node recipes
export const getByNode = (world: World, components: Components, entity: EntityIndex): Recipe[] => {
  const results = queryForRecipebyNode(components, entity);
  return results.map((recipe) =>
    getRecipe(world, components, recipe, getIndex(components, recipe))
  );
}; */

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
