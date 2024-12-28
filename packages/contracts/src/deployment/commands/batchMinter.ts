const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { ethers } from 'ethers';

import { getSigner, getSystemAddr } from './utils/utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -mode <mode> -world <address>')
  .demandOption(['mode'])
  .parse();
dotenv.config();

/// CONSTANTS
const abi = [
  {
    type: 'function',
    name: 'batchMint',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

const run = async () => {
  const mode = argv.mode || 'DEV';
  const signer = await getSigner(mode);

  const toMint = argv.amount || 0;

  const minterSystem = new ethers.Contract(
    await getSystemAddr(mode, 'system.Kami721.BatchMint'),
    abi,
    signer
  );
  console.log('createSystem: ' + minterSystem.address);

  const increment = 5;
  for (let i = 0; i < toMint; i += increment) {
    try {
      const tx = await minterSystem.batchMint(increment);
      console.log(tx.hash);
      console.log('total minted: ' + i);
    } catch (e) {
      console.log('failed ');
      console.log(e);
    }
  }

  const tx = await minterSystem.batchMint(toMint % increment);
  console.log(tx.hash);
  console.log('total minted: ' + toMint);
  console.log('done');
};

run();
