const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { getSigner, getSystemAddr } from '../utils';

// deprecated
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -mode <mode> -world <address>')
  .demandOption(['mode'])
  .parse();

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
  const signer = await getSigner();

  const toMint = argv.amount || 0;

  const minterSystem = new ethers.Contract(
    await getSystemAddr('system.Kami721.BatchMint'),
    abi,
    signer
  );
  console.log('createSystem: ' + minterSystem.address);

  const increment = 10;
  for (let i = 0; i < toMint; i += increment) {
    try {
      const tx = await minterSystem.batchMint(increment, { gasLimit: 30000000 });
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
