const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { genBatchTx } from '../scripts/multisig/system';
import { setAutoMine } from '../utils';

const argv = yargs(hideBin(process.argv)).option('addresses', {
  string: true,
}).argv;

const run = async () => {
  const systems = argv.systems; // only supports 1 for now
  const addrs = argv.addresses;

  setAutoMine(true);

  console.log(`Generating batch txs for ${systems} at ${addrs}`);
  await genBatchTx(systems, addrs);

  await setAutoMine(false);
};

run();
