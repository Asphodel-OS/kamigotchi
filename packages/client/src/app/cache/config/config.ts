import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import {
  getConfigFieldValue,
  getConfigFieldValueAddress,
  getConfigFieldValueArray,
} from 'network/shapes/Config';
import { Address } from 'viem';

export const ValueCache = new Map<string, number>();
export const AddressCache = new Map<string, Address>();
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

export const getAddress = (world: World, components: Components, field: string): Address => {
  if (!AddressCache.has(field)) processAddress(world, components, field);
  return AddressCache.get(field)!;
};

export const processAddress = (world: World, components: Components, field: string): string => {
  const address = getConfigFieldValueAddress(world, components, field);
  if (address != '0x000000000000000000000000000000000000dEaD') AddressCache.set(field, address);
  return address;
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
