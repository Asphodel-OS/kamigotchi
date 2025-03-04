import { EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { Item } from '../Item';

import { Components } from 'network/';

export interface Ingredient {
  item?: Item; // this is populated by the cache
  index: number;
  amount: number;
}

export const getIngredients = (
  world: World,
  components: Components,
  entity: EntityIndex | undefined
): Ingredient[] => {
  if (!entity) return [];

  const { Keys, Values } = components;
  const keys = getComponentValue(Keys, entity)?.value as number[] | [];
  const values = getComponentValue(Values, entity)?.value as number[] | [];

  return keys.map((itemIndex, i) => getIngredient(itemIndex, values[i] * 1));
};

const getIngredient = (itemIndex: number, amount: number): Ingredient => {
  return {
    index: itemIndex,
    amount: amount,
  };
};
