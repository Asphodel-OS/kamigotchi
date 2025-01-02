import { AdminAPI } from '../api';

import { ethers } from 'ethers';
import { file as itemData } from '../../commands/data/ItemTransfer.json';
import { file as kamiData } from '../../commands/data/KamiTransfer.json';

export async function initSnapshot(api: AdminAPI) {
  await initTransferKamis(api);
  await initTransferItems(api);
}

async function initTransferKamis(api: AdminAPI) {
  await api.mint.create.init();

  for (let i = 0; i < kamiData.length; i++) {
    await api.mint.create.mint(
      ethers.utils.getAddress(kamiData[i].owneraddress),
      kamiData[i].backgroundindex,
      kamiData[i].bodyindex,
      kamiData[i].colourindex,
      kamiData[i].faceindex,
      kamiData[i].handindex
    );
  }
}

async function initTransferItems(api: AdminAPI) {
  // await api.admin.give('0x90A4c3f14Ff2CfF04e2811b67238Ba2aB72F7e12', 'ITEM', 4, 100);
  for (let i = 0; i < itemData.length; i++) {
    if (Number(itemData[i].balance) === 0) continue;
    await api.admin.give(
      ethers.utils.getAddress(itemData[i].owneraddress),
      'ITEM',
      itemData[i].item_index,
      itemData[i].balance
    );
  }
}
