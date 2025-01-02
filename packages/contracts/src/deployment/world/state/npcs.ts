import { AdminAPI } from '../api';

export async function initNpcs(api: AdminAPI) {
  await initMerchants(api);
}

export async function initMerchants(api: AdminAPI) {
  // create our hottie merchant ugajin. names are unique
  await api.npc.create(1, 'Mina', 13);
}
