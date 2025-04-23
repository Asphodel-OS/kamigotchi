import { AdminAPI } from '../api';

export async function initGachaPool(api: AdminAPI, numToMint: number) {
  await api.mint.batchMinter.init();

  const batchSize = 40;
  const numLoops = Math.floor(numToMint / batchSize);
  for (let i = 0; i < numLoops; i++) {
    await api.mint.batchMinter.mint(batchSize, '60000000'); // max lane gas 70m
  }
  await api.mint.batchMinter.mint(numToMint % batchSize, '60000000');
}

export async function mintToGachaPool(api: AdminAPI, rawAmt: number[]) {
  const amt = rawAmt[0] || 0;
  const batchSize = 40;
  const numLoops = Math.floor(amt / batchSize);
  for (let i = 0; i < numLoops; i++) {
    await api.mint.batchMinter.mint(batchSize, '60000000');
  }
  await api.mint.batchMinter.mint(amt % batchSize, '60000000');
}
