import { AdminAPI } from '../admin';

import { tester as data } from '../../commands/data/KamiTransfer.json';

export async function initSnapshot(api: AdminAPI) {
  initTransferKamis(api);
  initTransferItems(api);
}

async function initTransferKamis(api: AdminAPI) {
  await api.mint.create.init();

  for (let i = 0; i < data.length; i++) {
    await api.mint.create.mint(
      data[i].owneraddress,
      data[i].backgroundindex,
      data[i].bodyindex,
      data[i].colourindex,
      data[i].faceindex,
      data[i].handindex
    );
  }
}

async function initTransferItems(api: AdminAPI) {
  await api.admin.give('0x90A4c3f14Ff2CfF04e2811b67238Ba2aB72F7e12', 'ITEM', 4, 100);
}
