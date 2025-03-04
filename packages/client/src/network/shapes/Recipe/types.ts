import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition, getConditionsOf } from '../Conditional';
import { getStat } from '../Stats';
import { getEntityByHash } from '../utils';
import { getIngredients, Ingredient } from './ingredients';

export interface Recipe {
  id: EntityID;
  index: number;
  entity: EntityIndex;
  inputs: Ingredient[];
  outputs: Ingredient[];
  experience: number;
  cost: {
    stamina: number;
  };
  requirements: Condition[];
}

export const getRecipe = (
  world: World,
  components: Components,
  entity: EntityIndex,
  recipeIndex?: number
): Recipe => {
  const { Experience, RecipeIndex, Stamina } = components;

  recipeIndex = recipeIndex ?? (getComponentValue(RecipeIndex, entity)?.value as number);

  let recipe: Recipe = {
    id: world.entities[entity],
    index: recipeIndex,
    entity,
    inputs: getIngredients(world, components, getInputAnchor(world, recipeIndex)),
    outputs: getIngredients(world, components, getOutputAnchor(world, recipeIndex)),
    experience: (getComponentValue(Experience, entity)?.value as number) * 1,
    cost: {
      stamina: getStat(entity, Stamina).sync * 1,
    },
    requirements: getConditionsOf(world, components, 'recipe.requirement', recipeIndex),
  };

  return recipe;
};

//////////////////
// IDs

export const getRegEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.recipe', recipeIndex], ['string', 'uint32']);
};

export const getInputAnchor = (world: World, recipeIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['recipe.input', recipeIndex], ['string', 'uint32']);
};

export const getOutputAnchor = (world: World, recipeIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['recipe.output', recipeIndex], ['string', 'uint32']);
};
