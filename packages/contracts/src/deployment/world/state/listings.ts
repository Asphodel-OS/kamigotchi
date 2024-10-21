import { BigNumberish } from 'ethers';
import { AdminAPI } from '../admin';
import { getGoalID } from './utils';

export async function initListings(api: AdminAPI) {
  setListing(api, 1, 11301, 50); // gum (S)
  setListing(api, 1, 11303, 180); // candy (M)
  setListing(api, 1, 11304, 320); // cookie sticks (L)
  setListing(api, 1, 11001, 100); // ribbon

  setListing(api, 1, 21201, 50); // ice cream (S)
  setListing(api, 1, 21202, 90); // ice cream (M)
  setListing(api, 1, 21203, 160); // ice cream (L)

  setListing(api, 1, 21100, 35); // teleport scroll
  initRequirement(api, 1, 21100, 'COMPLETE_COMP', 'BOOL_IS', 0, getGoalID(5)); // require 1 teleport scroll
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

async function setListing(
  api: AdminAPI,
  merchantIndex: number,
  itemIndex: number,
  buyPrice: number,
  sellPrice = 0
) {
  await api.listing.set(merchantIndex, itemIndex, buyPrice, sellPrice);
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
  await api.listing.add.requirement(npcIndex, itemIndex, conditionType, logicType, index, value);
};
