import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { BigNumber, utils } from 'ethers';

import { Components } from 'network/';

const IDStore = new Map<string, string>();

// unpack a uint32[8] array from a config uint256
export const unpackArray32 = (packed: BigNumber | number): number[] => {
  packed = BigNumber.from(packed);
  const result = [];
  for (let i = 0; i < 8; i++) {
    // mask to current
    const curr = packed.and(BigNumber.from(1).shl(32).sub(1));
    // push to array
    result.push(curr.toNumber());
    // updated packed
    packed = packed.shr(32);
  }
  return result.reverse();
};

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

const getEntityIndex = (
  world: any,
  holderID: EntityID,
  index: number,
  field: string
): EntityIndex | undefined => {
  let id = '';
  const key = 'idData' + holderID + index.toString() + field;

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(
      ['string', 'uint256', 'uint32', 'string'],
      ['is.data', holderID ? holderID : ('0x00' as EntityID), index, field]
    ) as EntityID;
  }

  return world.entityToIndex.get(formatEntityID(id));
};
