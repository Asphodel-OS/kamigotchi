import { EntityID, EntityIndex, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { getHolderID, getValue } from '../utils/component';
import { getEntity, getType } from './utils';

// standardized Object shape of a Score Entity
export interface Score {
  holderID: EntityID;
  value: number;
}

export interface ScoresFilter {
  epoch: number;
  index: number;
  type: string;
}

// get a Score object from its EnityIndex
export const get = (comps: Components, entity: EntityIndex): Score => {
  return {
    holderID: getHolderID(comps, entity),
    value: getValue(comps, entity),
  };
};

export const getFromHash = (
  world: World,
  comps: Components,
  holderID: EntityID,
  epoch: number,
  index: number,
  type: string
): Score => {
  const entity = getEntity(world, holderID, epoch, index, type);
  return {
    holderID,
    value: entity ? getValue(comps, entity) : 0,
  };
};

// get all scores of a given type (based on TypeID)
export const getByType = (comps: Components, typeID: EntityID): Score[] => {
  const { TypeID } = comps;
  const queryFragments = [HasValue(TypeID, { value: typeID })] as QueryFragment[];
  const entities = Array.from(runQuery(queryFragments));

  const scores = entities.map((index) => get(comps, index));
  return scores.sort((a, b) => b.value - a.value);
};

// get all scores that match a filter -> type
export const getByFilter = (comps: Components, filter: ScoresFilter): Score[] => {
  const typeID = getType(filter.epoch, filter.index, filter.type);
  return getByType(comps, typeID);
};
