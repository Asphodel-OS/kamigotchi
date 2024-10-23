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
import { tester as data } from './data/KamiTransfer.json';
// hardcoded abi from _CreatePetSystem
const abi = [
  {
    type: 'function',
    name: 'create',
    inputs: [
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
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'function', name: 'setTraits', inputs: [], outputs: [], stateMutability: 'nonpayable' },
];

const factoryabi = [
  {
    type: 'function',
    name: 'createERC20',
    inputs: [
      {
        name: 'name',
        type: 'string',
        internalType: 'string',
      },
      {
        name: 'symbol',
        type: 'string',
        internalType: 'string',
      },
      {
        name: 'decimals',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

const erc20abi = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      {
        name: 'to',
        type: 'address',
        internalType: 'address',
      },
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

const successful: string[] = []; // i love global variables
const failed: string[] = [];

const runner = async () => {
  const mode = argv.mode || 'TEST';
  const signer = await getSigner(mode);

  const erc20 = new ethers.Contract('0x9D9c32921575Fd98e67E27C0189ED4b750Cb17C5', erc20abi, signer);

  const tx = await erc20.mint(
    '0x26274225b556D623367ddA1D07120B92F4983d6B',
    '1000000000000000000000000000000000'
  );
  console.log(tx);
  const r = await tx.wait();
  console.log(r);

  // const factory = new ethers.Contract(
  //   '0xb16A73790554bd97C70bE2671DDBDBAc12C97C4D',
  //   factoryabi,
  //   signer
  // );

  // const tx = await factory.createERC20('ONYX', 'ONYX', 18);
  // console.log(tx);
  // const r = await tx.wait();
  // console.log(r);
  // console.log(r.logs[0].topics);
  // console.log(r.logs[1].topics);
};

const run = async () => {
  const mode = argv.mode || 'DEV';
  const signer = await getSigner(mode);

  const createSystem = new ethers.Contract(
    await getSystemAddr(mode, 'system.Kami721.create'),
    abi,
    signer
  );
  console.log('createSystem: ' + createSystem.address);

  // createSystem.setTraits();

  for (let i = 0; i < data.length; i++) {
    try {
      const tx = await createSystem.create(
        data[i].owneraddress,
        data[i].backgroundindex,
        data[i].bodyindex,
        data[i].colourindex,
        data[i].faceindex,
        data[i].handindex
      );
      txWaiter(data[i].owneraddress, tx);
    } catch (e) {
      console.log('failed: ' + data[i].owneraddress);
      console.log(e);
      failed.push(data[i].owneraddress);
    }
  }
};

async function txWaiter(index: string, tx: ethers.providers.TransactionResponse) {
  try {
    await tx.wait();
    console.log('done: ' + index);
    successful.push(index);
  } catch (e) {
    console.log('failed: ' + index);
    failed.push(index);
  }
}

// run();
runner();
