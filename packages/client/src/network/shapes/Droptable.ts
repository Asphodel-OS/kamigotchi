import { EntityIndex, getComponentValue } from '@mud-classic/recs';
import { Components } from 'network/';
import { DetailedEntity } from './utils';

export interface Droptable {
  keys: number[];
  weights: number[];
}

export interface DTResult {
  amount: number;
  rarity: number;
  object: DetailedEntity;
}

export const getDroptable = (components: Components, index: EntityIndex): Droptable => {
  const { Keys, Weights } = components;
  return {
    keys: getComponentValue(Keys, index)?.value as number[],
    weights: getComponentValue(Weights, index)?.value as number[],
  };
};

export const getDTResults = (
  components: Components,
  droptable: Droptable,
  amounts: number[],
  getObject: (index: number) => DetailedEntity // expected to be called with external context
): DTResult[] => {
  const results: DTResult[] = [];
  for (let i = 0; i < droptable.keys.length; i++) {
    if (amounts[i] > 0) {
      const rarity = droptable.weights[i];
      const object = getObject(droptable.keys[i]);
      results.push({ amount: amounts[i], rarity, object });
    }
  }
  return results;
};
