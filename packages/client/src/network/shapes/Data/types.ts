import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getEntityByHash, unpackArray32 } from '../utils';

// get a DataEntity for an account
export const getData = (
  world: World,
  components: Components,
  id: EntityID,
  type: string,
  index?: number
): number => {
  return _getData(world, components, id, type, index) * 1;
};

export const getDataArray = (
  world: World,
  components: Components,
  id: EntityID,
  type: string,
  index?: number
): number[] => {
  const raw = _getData(world, components, id, type, index);
  if (!raw) return [0, 0, 0, 0, 0, 0, 0, 0];
  return unpackArray32(raw);
};

// raw version, returns unchecked number
export const _getData = (
  world: World,
  components: Components,
  id: EntityID,
  type: string,
  index?: number
): number => {
  const { Value } = components;
  const configEntityIndex = getEntityIndex(world, id, index ? index : 0, type);
  if (!configEntityIndex) {
    // console.warn(`data field not found for ${type}`);
    return 0;
  }
  return getComponentValue(Value, configEntityIndex)?.value as number;
};

//////////////////
// UTILS

const getEntityIndex = (
  world: any,
  holderID: EntityID,
  index: number,
  field: string
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['is.data', holderID, index, field],
    ['string', 'uint256', 'uint32', 'string']
  );
};
