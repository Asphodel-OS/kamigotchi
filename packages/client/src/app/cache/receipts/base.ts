import { EntityIndex, World } from 'engine/recs';
import { Components } from 'network/';
import { getReceipt, Receipt } from 'network/shapes/Portal';
import { getItemIndex, getOwnsWithdwalID } from 'network/shapes/utils/component';
import { getAccount } from '../account';
import { getItemByIndex } from '../item';

const ReceiptCache = new Map<EntityIndex, Receipt>(); // receipt entity -> Receipt

// save the requested receipt entity to the cache
const process = (world: World, comps: Components, entity: EntityIndex): Receipt => {
  const receipt = getReceipt(world, comps, entity);

  const itemIndex = getItemIndex(comps, entity);
  receipt.item = getItemByIndex(world, comps, itemIndex);

  const accountID = getOwnsWithdwalID(comps, entity);
  const accountEntity = world.entityToIndex.get(accountID);
  if (accountEntity !== undefined) {
    receipt.account = getAccount(world, comps, accountEntity);
  }

  ReceiptCache.set(entity, receipt);
  return receipt;
};

// get an receipt by its EnityIndex
export const get = (world: World, comps: Components, entity: EntityIndex): Receipt => {
  if (!ReceiptCache.has(entity)) process(world, comps, entity);
  return ReceiptCache.get(entity)!;
};
