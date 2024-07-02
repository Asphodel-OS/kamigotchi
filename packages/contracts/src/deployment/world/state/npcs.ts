import { AdminAPI } from '../admin';

export async function initNpcs(api: AdminAPI) {
  await initMerchants(api);
}

export async function initMerchants(api: AdminAPI) {
  // create our hottie merchant ugajin. names are unique
  await api.npc.create(1, 'Mina', 13);

  await api.listing.set(1, 101, 50, 0); // merchant index, item index, buy price, sell price
  await api.listing.set(1, 102, 180, 0);
  await api.listing.set(1, 103, 320, 0);
  await api.listing.set(1, 110, 500, 0);
}
