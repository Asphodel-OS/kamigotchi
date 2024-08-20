import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
import { queryActions } from './Assigner';
import { getItemDetailsByIndex } from './Item';
import { getStat } from './Stats';
import { DetailedEntity } from './utils';

/////////////////
// GETTERS

export const getRecipeByIndex = (world: World, components: Components, index: number): Recipe => {
  const entityIndex = getRegEntity(world, index);
  if (!entityIndex) return NullRecipe;

  return getRecipe(world, components, entityIndex, index);
};

export const getRecipesByAssigner = (
  world: World,
  components: Components,
  assignerID: EntityID
): Recipe[] => {
  const entities = queryActions(world, components, assignerID, { recipe: true });
  return entities.map((entityIndex) => getRecipe(world, components, entityIndex));
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
  };

  return recipe;
};

const getIngredients = (
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
};

//////////////////
// IDs

const IDStore = new Map<string, string>();

const getRegEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  let id = '';
  const key = 'registry.recipe' + recipeIndex.toString();
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint32'], ['registry.recipe', recipeIndex])
    );
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};

const getInputEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  let id = '';
  const key = 'recipe.input' + recipeIndex.toString();
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint32'], ['recipe.input', recipeIndex])
    );
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};

const getOutputEntity = (world: World, recipeIndex: number): EntityIndex | undefined => {
  let id = '';
  const key = 'recipe.output' + recipeIndex.toString();
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'uint32'], ['recipe.output', recipeIndex])
    );
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};
