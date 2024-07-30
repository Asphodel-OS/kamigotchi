import { AdminAPI } from '../admin';

export async function initGachaPool(api: AdminAPI, numToMint: number) {
  await api.mint.batchMinter.init();

  const batchSize = 8;
  const numLoops = Math.floor(numToMint / batchSize);
  for (let i = 0; i < numLoops; i++) {
    await api.mint.batchMinter.mint(batchSize);
  }
  await api.mint.batchMinter.mint(numToMint % batchSize);
}
