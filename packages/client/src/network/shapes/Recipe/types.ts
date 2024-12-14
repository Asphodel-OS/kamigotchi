import { EntityID, EntityIndex, Has, World, getComponentValue, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition, queryConditionsOf } from '../Conditional';
import { getItemDetailsByIndex } from '../Item';
import { getStat } from '../Stats';
import { DetailedEntity, getEntityByHash } from '../utils';

/////////////////
// GETTERS

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

/////////////////
// SHAPES

export interface Recipe {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  inputs: Ingredient[];
  outputs: Ingredient[];
  experience: number;
  cost: {
    stamina: number;
  };
  requirements: Condition[];
}

export interface Ingredient {
  item: DetailedEntity;
  index: number;
  amount: number;
}

export const getRecipe = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  recipeIndex?: number
): Recipe => {
  const { Experience, RecipeIndex, Stamina } = components;

  recipeIndex = recipeIndex ?? (getComponentValue(RecipeIndex, entityIndex)?.value as number);

  let recipe: Recipe = {
    id: world.entities[entityIndex],
    index: recipeIndex,
    entityIndex,
    inputs: getIngredients(world, components, getInputEntity(world, recipeIndex)),
    outputs: getIngredients(world, components, getOutputEntity(world, recipeIndex)),
    experience: (getComponentValue(Experience, entityIndex)?.value as number) * 1,
    cost: {
      stamina: getStat(entityIndex, Stamina).sync * 1,
    },
    requirements: queryConditionsOf(world, components, 'recipe.requirement', recipeIndex),
  };

  return recipe;
};

export const getIngredients = (
  world: World,
  components: Components,
  entityIndex: EntityIndex | undefined
): Ingredient[] => {
  if (!entityIndex) return [];

  const { Keys, Values } = components;
  const keys = getComponentValue(Keys, entityIndex)?.value as number[] | [];
  const values = getComponentValue(Values, entityIndex)?.value as number[] | [];

  return keys.map((itemIndex, i) => getIngredient(world, components, itemIndex, values[i] * 1));
};

const getIngredient = (
  world: World,
  components: Components,
  itemIndex: number,
  amount: number
): Ingredient => {
  return {
    item: getItemDetailsByIndex(world, components, itemIndex),
    index: itemIndex,
    amount: amount,
  };
};

export const NullRecipe: Recipe = {
  id: '0' as EntityID,
  index: 0,
  entityIndex: 0 as EntityIndex,
  inputs: [],
  outputs: [],
  experience: 0,
  cost: {
    stamina: 0,
  },
  requirements: [],
};

//////////////////
// IDs

export const getRegEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.recipe', recipeIndex], ['string', 'uint32']);
};

export const getInputEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['recipe.input', recipeIndex], ['string', 'uint32']);
};

export const getOutputEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['recipe.output', recipeIndex], ['string', 'uint32']);
};
