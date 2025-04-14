import { TxBuilder } from '@morpho-labs/gnosis-tx-builder';
import { BatchTransaction } from '@morpho-labs/gnosis-tx-builder/lib/src/types';
import dotenv from 'dotenv';
import execa = require('execa');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { SystemABI, UintCompABI, WorldABI } from '../../contracts/mappings/worldABIs';
import {
  getCompIDByName,
  getDeploySystems,
  getSystemIDByName,
  keccak256,
  WorldAddresses,
} from '../../utils';
import { writeBatchTx } from './utils/write';

// genBatchTx('AccountRegisterSystem', '0x2722a36D8e1772A390e32494DE9Cc14365df63BB');

export async function genBatchTx(systems: string, addrs: string) {
  const World = new WorldAddresses();

  // assume only 1 system for now !!
  const deployConfig = getDeploySystems(systems);
  const sysConfig = deployConfig.systems[0];

  let transactions: BatchTransaction[] = [];
  // checking for prev system, deprecate if so
  const sysID = getSystemIDByName(sysConfig.name);
  let sysAddr = (await World.getSysAddr(sysID)) || '0';
  if (Number(sysAddr) !== 0) {
    transactions.push(await deprecateTx(sysAddr));
    transactions = transactions.concat(
      await authorizeTxs(World, sysConfig.writeAccess, sysAddr, true)
    );
  }

  // todo: deploy new system now, + transfer owner
  // use regular deploy script, findLog system address. do deprecate + register + permissions if initWorld || multisig == 0
  const newSysAddr = addrs;

  transactions.push(await registerSystemTx(World, sysConfig)); // registering new system
  // authorize new system
  transactions = transactions.concat(await authorizeTxs(World, sysConfig.writeAccess, newSysAddr));

  // write file
  const batchJson = TxBuilder.batch(process.env.MULTISIG!, transactions, {
    chainId: Number(process.env.CHAIN_ID!),
  });
  writeBatchTx(batchJson);
}

//////////////////
// INDIVIDUAL TXS

const authorizeTxs = async (
  World: WorldAddresses,
  compNames: string[],
  writer: string,
  revoke?: boolean
) => {
  const txs: BatchTransaction[] = [];
  for (let i = 0; i < compNames.length; i++) {
    const compID = getCompIDByName(compNames[i]);
    const tx = await authorizeTx(World, compID, writer, revoke);
    txs.push(tx);
  }
  return txs;
};

const authorizeTx = async (
  World: WorldAddresses,
  compID: string,
  writer: string,
  revoke?: boolean
) => {
  return {
    to: (await World.getCompAddr(compID))!,
    value: '0',
    contractMethod: getCompMethod(revoke),
    contractInputsValues: {
      writer: writer,
    },
  };
};

const deprecateTx = (sysAddr: string) => {
  const callABI = SystemABI.find((a: any) => a.type === 'function' && a.name === 'deprecate')!;
  return {
    to: sysAddr,
    value: '0',
    contractMethod: {
      name: 'deprecate',
      inputs: callABI.inputs,
      payable: false,
    },
    contractInputsValues: {},
  };
};

const registerSystemTx = async (World: WorldAddresses, sysConfig: any) => {
  const sysID = keccak256(getSystemIDByName(sysConfig.name));
  const callABI = WorldABI.find((a: any) => a.type === 'function' && a.name === 'registerSystem')!;
  return {
    to: World.worldAddr,
    value: '0',
    contractMethod: {
      name: 'registerSystem',
      inputs: callABI.inputs,
      payable: false,
    },
    contractInputsValues: {
      addr: (await World.getSysAddr(sysID))!,
      id: sysID,
    },
  };
};

const getCompMethod = (unauthorize?: boolean) => {
  const func = unauthorize ? 'unauthorizeWriter' : 'authorizeWriter';
  const raw = UintCompABI.find((abi: any) => abi.type === 'function' && abi.name === func);
  // return raw;
  // return `function ${func}(address writer)`;
  return {
    name: func,
    inputs: raw!.inputs,
    payable: false,
  };
};
