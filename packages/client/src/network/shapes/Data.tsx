import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { utils } from 'ethers';

import { Components } from 'network/';

// get a DataEntity for an account
export const getData = (
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
  return (getComponentValue(Value, configEntityIndex)?.value as number) * 1;
};

const getEntityIndex = (
  world: any,
  holderID: EntityID,
  index: number,
  field: string
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'uint32', 'string'],
    ['is.data', holderID ? holderID : ('0x00' as EntityID), index, field]
  );
  return world.entityToIndex.get(id as EntityID);
};
