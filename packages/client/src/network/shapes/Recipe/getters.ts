import { Has, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { NullRecipe } from './constants';
import { get, getRegEntity, Recipe } from './types';

export const getAllRecipes = (world: World, components: Components): Recipe[] => {
  const { RecipeIndex, IsRegistry } = components;
  const entities = Array.from(runQuery([Has(RecipeIndex), Has(IsRegistry)]));
  return entities.map((index) => get(world, components, index));
};

export const getByIndex = (world: World, components: Components, index: number): Recipe => {
  const entity = getRegEntity(world, index);
  if (!entity) return NullRecipe;

  return get(world, components, entity, index);
};
