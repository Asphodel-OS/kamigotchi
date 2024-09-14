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
import { data } from './data/KamiRecovery.json';
// hardcoded abi from _CreatePetSystem
const abi = [
  {
    type: 'function',
    name: 'restore',
    inputs: [
      {
        name: 'index',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'accID',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'background',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'body',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'color',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'face',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'hand',
        type: 'uint32',
        internalType: 'uint32',
      },
      {
        name: 'level',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

const successful: number[] = []; // i love global variables
const failed: number[] = [];

const run = async () => {
  const mode = argv.mode || 'DEV';
  const signer = await getSigner(mode);

  const restoreSystem = new ethers.Contract(
    await getSystemAddr(mode, 'system.Pet721.create'),
    abi,
    signer
  );
  console.log('restoreSystem: ' + restoreSystem.address);

  // for (let i = 0; i < data.length; i++) {
  for (let i = 5; i < 909; i++) {
    // 909
    if (i == 632 || i == 633) continue;
    const index = Number(data[i].kamiindex) + 5000;
    try {
      const tx = await restoreSystem.restore(
        index,
        data[i].ownerentityid,
        data[i].background,
        data[i].body,
        data[i].color,
        data[i].face,
        data[i].hand,
        data[i].kamilevel
      );
      txWaiter(index, tx);
    } catch (e) {
      console.log('failed: ' + index);
      failed.push(index);
    }
  }
};

async function txWaiter(index: number, tx: ethers.providers.TransactionResponse) {
  try {
    await tx.wait();
    console.log('done: ' + index);
    successful.push(index);
  } catch (e) {
    console.log('failed: ' + index);
    failed.push(index);
  }
}

run();
