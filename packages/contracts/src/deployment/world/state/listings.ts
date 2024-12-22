import { BigNumberish } from 'ethers';
import { AdminAPI } from '../admin';
import { getGoalID } from './utils';

export async function initListings(api: AdminAPI) {
  setListing(api, 1, 11301, 60); // gum (S)
  setListing(api, 1, 11303, 100); // candy (M)
  setListing(api, 1, 11304, 160); // cookie sticks (L)
  setListing(api, 1, 11001, 100); // ribbon

  setListing(api, 1, 21201, 150); // ice cream (S)
  setListing(api, 1, 21202, 250); // ice cream (M)
  setListing(api, 1, 21203, 450); // ice cream (L)

  setListing(api, 1, 21100, 250); // teleport scroll
  initRequirement(api, 1, 21100, 'COMPLETE_COMP', 'BOOL_IS', 0, getGoalID(5)); // require 1 teleport scroll

  setListing(api, 1, 23100, 2500); // space grinder
  setListing(api, 1, 23101, 4000); // portable burner
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
  await api.listing.add.requirement(
    npcIndex,
    itemIndex,
    conditionType,
    logicType,
    index,
    value,
    ''
  );
};
