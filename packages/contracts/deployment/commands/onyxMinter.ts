const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { ethers } from 'ethers';

import { getSigner } from '../utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -mode <mode> -amount <amount>')
  .demandOption(['mode'])
  .parse();
dotenv.config();

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

const FactoryAddress = '0xb16A73790554bd97C70bE2671DDBDBAc12C97C4D';
const OnyxAddress = '0x9D9c32921575Fd98e67E27C0189ED4b750Cb17C5';

const deployERC20 = async () => {
  const mode = argv.mode || 'TEST';
  const signer = await getSigner(mode);

  const factory = new ethers.Contract(FactoryAddress, factoryabi, signer);

  const tx = await factory.createERC20('ONYX', 'ONYX', 18);
  console.log(tx);
  const r = await tx.wait();
  console.log(r);
  console.log(r.logs[0].topics);
  console.log(r.logs[1].topics);
};

const mintOnyx = async () => {
  const mode = argv.mode || 'TEST';
  const amount = argv.amount || '1';
  const signer = await getSigner(mode);

  const erc20 = new ethers.Contract(OnyxAddress, erc20abi, signer);

  const tx = await erc20.mint(
    signer.address,
    amount.toString() + '000000000000000000' // 18 decimals
  );
  console.log(tx);
  const r = await tx.wait();
  console.log(r);
};
