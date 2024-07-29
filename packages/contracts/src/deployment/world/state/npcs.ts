import { AdminAPI } from '../admin';

export async function initNpcs(api: AdminAPI) {
  await initMerchants(api);
}

export async function initMerchants(api: AdminAPI) {
  // create our hottie merchant ugajin. names are unique
  await api.npc.create(1, 'Mina', 13);

  // merchant index, item index, buy price, sell price
  setListing(api, 1, 101, 50); // gum (S)
  setListing(api, 1, 102, 180); // candy (M)
  setListing(api, 1, 103, 320); // cookie sticks (L)

  setListing(api, 1, 107, 160); // ice cream (L)
  setListing(api, 1, 108, 90); // ice cream (M)
  setListing(api, 1, 109, 50); // ice cream (S)

  setListing(api, 1, 110, 100); // ribbon
}

export async function setListing(
  api: AdminAPI,
  merchantIndex: number,
  itemIndex: number,
  buyPrice: number,
  sellPrice = 0
) {
  await api.listing.set(merchantIndex, itemIndex, buyPrice, sellPrice);
}
