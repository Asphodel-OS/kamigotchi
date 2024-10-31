import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getConfigFieldValue, getConfigFieldValueArray } from 'network/shapes/Config';

export const ValueCache = new Map<string, number>();
export const ArrayCache = new Map<string, number[]>();
export const UpdateTs = new Map<string, number>(); // last update ts of config field

export const getValue = (world: World, components: Components, field: string): number => {
  if (!ValueCache.has(field)) processValue(world, components, field);
  return ValueCache.get(field)!;
};

export const processValue = (world: World, components: Components, field: string): number => {
  const value = getConfigFieldValue(world, components, field);
  ValueCache.set(field, value);
  return value;
};

// get an array type of config field
export const getArray = (world: World, components: Components, field: string): number[] => {
  if (!ArrayCache.has(field)) processArray(world, components, field);
  return ArrayCache.get(field)!;
};

// process an array type of config field
export const processArray = (world: World, components: Components, field: string): number[] => {
  const values = getConfigFieldValueArray(world, components, field);
  ArrayCache.set(field, values);
  return values;
};
