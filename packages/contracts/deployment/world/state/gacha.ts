import { AdminAPI } from '../api';

export async function initGachaPool(api: AdminAPI, numToMint: number) {
  await api.mint.batchMinter.init();

  const batchSize = 50;
  const numLoops = Math.floor(numToMint / batchSize);
  for (let i = 0; i < numLoops; i++) {
    await api.mint.batchMinter.mint(batchSize, '100000000');
  }
  await api.mint.batchMinter.mint(numToMint % batchSize, '100000000');
}

export async function mintToGachaPool(api: AdminAPI, rawAmt: number[]) {
  const amt = rawAmt[0] || 0;
  const batchSize = 50;
  const numLoops = Math.floor(amt / batchSize);
  for (let i = 0; i < numLoops; i++) {
    await api.mint.batchMinter.mint(batchSize, '100000000');
  }
  await api.mint.batchMinter.mint(amt % batchSize, '100000000');
}
