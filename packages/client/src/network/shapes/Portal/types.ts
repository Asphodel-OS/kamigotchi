import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Account, getAccountByID } from '../Account';
import { getItemByIndex, Item } from '../Item';
import {
  getEndTime,
  getItemIndex,
  getOwnsWithdwalID,
  getStartTime,
  getValue,
} from '../utils/component';

export interface Receipt {
  id: EntityID;
  entity: EntityIndex;
  ObjectType: string;
  amt: number; // token amount
  time: {
    start: number;
    end: number;
  };
  account?: Account;
  item?: Item;
}

export interface Options {
  account?: boolean;
  item?: boolean;
}

// get a Receipt Object results from a Token Portal Withdraw request
export const getReceipt = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  options?: Options
): Receipt => {
  const id = world.entities[entity];
  const receipt: Receipt = {
    id,
    entity,
    ObjectType: 'TOKEN_RECEIPT',
    amt: getValue(comps, entity), // token amount
    time: {
      start: getStartTime(comps, entity),
      end: getEndTime(comps, entity),
    },
  };

  if (options === undefined) return receipt;

  if (options.account) {
    const accID = getOwnsWithdwalID(comps, entity);
    receipt.account = getAccountByID(world, comps, accID);
  }

  if (options.item) {
    const itemIndex = getItemIndex(comps, entity);
    receipt.item = getItemByIndex(world, comps, itemIndex);
  }

  return receipt;
};
