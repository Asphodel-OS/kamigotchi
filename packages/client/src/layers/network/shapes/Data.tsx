import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';
import { utils } from 'ethers';

import { NetworkLayer } from 'layers/network/types';

// get a DataEntity for an account
export const getData = (
  network: NetworkLayer,
  id: EntityID,
  type: string,
  index?: number
): number => {
  const {
    world,
    components: { BareValue },
  } = network;
  const configEntityIndex = getID(world, id, index ? index : 0, type);
  if (!configEntityIndex) {
    // console.warn(`data field not found for ${type}`);
    return 0;
  }
  return (getComponentValue(BareValue, configEntityIndex)?.value as number) * 1;
};

const getID = (
  world: any,
  holderID: EntityID,
  index: number,
  field: string
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'uint32', 'string'],
    ['Is.Data', holderID ? holderID : ('0x00' as EntityID), index, field]
  );
  return world.entityToIndex.get(id as EntityID);
};
