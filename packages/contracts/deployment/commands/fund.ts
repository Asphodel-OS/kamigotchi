const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import { JsonRpcProvider } from '@ethersproject/providers';
import dotenv from 'dotenv';

const argv = yargs(hideBin(process.argv)).argv;
dotenv.config();

const fund = async () => {
  const amount = argv.amount || '0x1000000000000000';
  const provider = new JsonRpcProvider(process.env.DEV_RPC!);
  await provider.send('hardhat_setBalance', [process.env.DEV_OWNER, amount]);
};

fund();
