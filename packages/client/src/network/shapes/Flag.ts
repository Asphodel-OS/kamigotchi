import {
  EntityID,
  EntityIndex,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';

import { Components } from 'network/';
import { getEntityByHash } from './utils';

// standardized Object shape of a Score Entity
export interface Flag {
  has: boolean;
  holder?: EntityID;
  type?: string;
}

export interface FlagsFilter {
  type: string;
}

export const hasFlag = (
  world: World,
  components: Components,
  holderID: EntityID,
  type: string
): boolean => {
  return _has(components, getEntityIndex(world, holderID, type));
};

export const getFlagFromHash = (
  world: World,
  components: Components,
  holderID: EntityID,
  type: string
): Flag => {
  return {
    has: _has(components, getEntityIndex(world, holderID, type)),
    holder: holderID,
    type: type,
  };
};

///////////////
// SHAPES

export const getFlag = (components: Components, index: EntityIndex): Flag => {
  const { HolderID, Type } = components;
  return {
    has: _has(components, index),
    holder: formatEntityID(getComponentValue(HolderID, index)?.value ?? ''),
    type: getComponentValue(Type, index)?.value as string,
  };
};

///////////////
// QUERIES

export const getFlagsByType = (world: World, components: Components, type: string): Flag[] => {
  const { Type } = components;

  // set filters
  const queryFragments = [HasValue(Type, { value: type })] as QueryFragment[];

  // retrieve the relevant entities and their shapes
  const entityIndices = Array.from(runQuery(queryFragments));
  return entityIndices.map((index) => getFlag(components, index));
};

export const getFlagsByFilter = (
  world: World,
  components: Components,
  filter: FlagsFilter
): Flag[] => {
  return getFlagsByType(world, components, filter.type);
};

///////////////
// UTILS

// gets the entity index for a flag based on the holder and field
const getEntityIndex = (
  world: any,
  holderID: EntityID | undefined,
  field: string
): EntityIndex | undefined => {
  if (!holderID) return;
  return getEntityByHash(world, ['has.flag', holderID, field], ['string', 'uint256', 'string']);
};

// checks whether or not a flag entity is set
const _has = (components: Components, index: EntityIndex | undefined): boolean => {
  const { HasFlag } = components;
  return index ? (getComponentValue(HasFlag, index)?.value as boolean) : false;
};
