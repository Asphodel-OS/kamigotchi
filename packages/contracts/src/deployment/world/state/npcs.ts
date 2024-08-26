import { AdminAPI } from '../admin';

export async function initNpcs(api: AdminAPI) {
  await initMerchants(api);
}

export async function initMerchants(api: AdminAPI) {
  // create our hottie merchant ugajin. names are unique
  await api.npc.create(1, 'Mina', 13);
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
