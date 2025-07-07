import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition, getConditionsOf } from '../Conditional';
import { getStat } from '../Stats';
import { getEntityByHash } from '../utils';
import { getExperience, getType } from '../utils/component';
import { getIngredients, Ingredient } from './ingredients';

export interface Recipe {
  entity: EntityIndex;
  id: EntityID;
  index: number;
  type: string;
  inputs: Ingredient[];
  outputs: Ingredient[];
  experience: number;
  cost: {
    stamina: number;
  };
  requirements: Condition[];
}

export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  index?: number
): Recipe => {
  const { RecipeIndex, Stamina } = components;

  index = index ?? (getComponentValue(RecipeIndex, entity)?.value as number);

  let recipe: Recipe = {
    entity,
    id: world.entities[entity],
    index: index,
    type: getType(components, entity),
    inputs: getIngredients(world, components, getInputAnchor(world, index)),
    outputs: getIngredients(world, components, getOutputAnchor(world, index)),
    experience: getExperience(components, entity),
    cost: {
      stamina: getStat(entity, Stamina).sync * 1,
    },
    requirements: getConditionsOf(world, components, 'recipe.requirement', index),
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
