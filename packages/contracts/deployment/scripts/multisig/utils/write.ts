import fs from 'fs';
import path from 'path';

export function writeBatchTx(batchJson: any) {
  fs.writeFileSync(
    path.join(__dirname, '../../../batchTx.json'),
    JSON.stringify(batchJson, null, 2)
  );
}
