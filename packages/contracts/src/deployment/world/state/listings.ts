import { BigNumberish } from 'ethers';
import { AdminAPI } from '../api';
import { getGoalID } from './utils';

export async function initListings(api: AdminAPI) {
  const create = api.listing.create;
  const setBuyFixed = api.listing.set.price.buy.fixed;

  // gakki gum (S)
  create(1, 11301, 60);
  setBuyFixed(1, 11301);

  // pompom candy (M)
  create(1, 11303, 100);
  setBuyFixed(1, 11303);

  // cookie sticks (L)
  create(1, 11304, 160);
  setBuyFixed(1, 11304);

  // ribbon
  create(1, 11001, 100);
  setBuyFixed(1, 11001);

  // ice cream (S)
  create(1, 21201, 150);
  setBuyFixed(1, 21201);

  // ice cream (M)
  create(1, 21202, 250);
  setBuyFixed(1, 21202);

  // ice cream (L)
  create(1, 21203, 450);
  setBuyFixed(1, 21203);

  // teleport scroll
  create(1, 21100, 250);
  setBuyFixed(1, 21100);
  initRequirement(api, 1, 21100, 'COMPLETE_COMP', 'BOOL_IS', 0, getGoalID(5)); // require 1 teleport scroll

  // spice grinder
  create(1, 23100, 2500);
  setBuyFixed(1, 23100);

  // portable burner
  create(1, 23101, 4000);
  setBuyFixed(1, 23101);
}

export async function deleteListings(api: AdminAPI, indices: number[]) {
  // assume NPC index = 1 (mina)
  for (let i = 0; i < indices.length; i++) {
    try {
      await api.listing.remove(1, indices[i]);
    } catch {
      console.error('Could not delete listing ' + indices[i]);
    }
  }
}

async function createListing(
  api: AdminAPI,
  merchantIndex: number,
  itemIndex: number,
  value: number
) {
  await api.listing.create(merchantIndex, itemIndex, value);
}

const initRequirement = async (
  api: AdminAPI,
  npcIndex: number,
  itemIndex: number,
  conditionType: string,
  logicType: string,
  index: number,
  value: BigNumberish
) => {
  await api.listing.set.requirement(
    npcIndex,
    itemIndex,
    conditionType,
    logicType,
    index,
    value,
    ''
  );
};
