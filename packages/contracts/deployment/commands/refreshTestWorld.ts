const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { getSigner, getSystemAddr } from '../utils';

// deprecated
const argv = yargs(hideBin(process.argv)).usage('Usage: $0 -mode <mode> -world <address>').parse();

/// CONSTANTS
const abi = [
  {
    type: 'function',
    name: 'executeTyped',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

const run = async () => {
  const signer = await getSigner();

  const triggerer = new ethers.Contract(await getSystemAddr('system.test.comp.event'), abi, signer);
  console.log('trigger system: ' + triggerer.address);

  const tx = await triggerer.executeTyped({ gasLimit: 200000 });
  console.log('tx: ' + tx.hash);
};

run();
