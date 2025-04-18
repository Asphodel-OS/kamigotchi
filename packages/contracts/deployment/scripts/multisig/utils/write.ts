import { TxBuilder } from '@morpho-labs/gnosis-tx-builder';
import { BatchTransaction } from '@morpho-labs/gnosis-tx-builder/lib/src/types';
import fs from 'fs';
import path from 'path';

export const batchTxDir = path.join(__dirname, '../../../transactions');

export function writeBatchTx(txs: BatchTransaction[]) {
  clearDir();

  const maxPerBatch = 100;
  let batchIndex = 0;
  for (let i = 0; i < txs.length; i += maxPerBatch) {
    const batch = txs.slice(i, i + maxPerBatch);
    const batchTx = TxBuilder.batch(process.env.MULTISIG!, batch, {
      chainId: Number(process.env.CHAIN_ID!),
    });
    writeFile(batchTx, batchIndex);
    batchIndex++;
  }
}

function clearDir() {
  if (!fs.existsSync(batchTxDir)) fs.mkdirSync(batchTxDir);
  else {
    const files = fs.readdirSync(batchTxDir);
    for (let i = 0; i < files.length; i++) fs.unlinkSync(path.join(batchTxDir, files[i]));
  }
}

async function writeFile(data: any, index: number) {
  const indexStr = index.toString().padStart(2, '0');
  fs.writeFile(path.join(batchTxDir, `${indexStr}.json`), JSON.stringify(data, null, 2), () => {});
}
