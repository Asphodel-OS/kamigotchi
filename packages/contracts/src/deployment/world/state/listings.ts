import { BigNumberish } from 'ethers';
import { AdminAPI } from '../admin';
import { getGoalID } from './utils';

export async function initListings(api: AdminAPI) {
  setListing(api, 1, 101, 50); // gum (S)
  setListing(api, 1, 102, 180); // candy (M)
  setListing(api, 1, 103, 320); // cookie sticks (L)
  setListing(api, 1, 110, 100); // ribbon

  setListing(api, 1, 107, 160); // ice cream (L)
  setListing(api, 1, 108, 90); // ice cream (M)
  setListing(api, 1, 109, 50); // ice cream (S)

  setListing(api, 1, 119, 35); // teleport scroll
  initRequirement(api, 1, 119, 'COMPLETE_COMP', 'BOOL_IS', 0, getGoalID(5)); // require 1 teleport scroll
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
