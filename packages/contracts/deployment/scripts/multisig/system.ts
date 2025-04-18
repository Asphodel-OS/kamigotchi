import { BatchTransaction } from '@morpho-labs/gnosis-tx-builder/lib/src/types';
import dotenv from 'dotenv';
import execa = require('execa');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { SystemABI, UintCompABI, WorldABI } from '../../contracts/mappings/worldABIs';
import {
  getCompIDByName,
  getDeployComponents,
  getDeploySystems,
  getSystemIDByName,
  keccak256,
  WorldAddresses,
} from '../../utils';
import { writeBatchTx } from './utils/write';

export async function genBatchTx(systems: string, rawAddrs: string) {
  const World = new WorldAddresses();
  const addrs = rawAddrs.split(',');

  // assume only 1 system for now !!
  const deployConfig = getDeploySystems(systems);

  let transactions: BatchTransaction[] = [];
  for (let i = 0; i < deployConfig.systems.length; i++) {
    const systemConfig = deployConfig.systems[i];
    transactions = transactions.concat(await genSingleBatch(World, systemConfig, addrs[i]));
  }
  // write file
  writeBatchTx(transactions);
}

async function genSingleBatch(World: WorldAddresses, systemConfig: any, newAddr: string) {
  let transactions: BatchTransaction[] = [];
  // checking for prev system, deprecate if so
  const sysID = getSystemIDByName(systemConfig.name);
  let sysAddr = (await World.getSysAddr(sysID)) || '0';
  if (Number(sysAddr) !== 0) {
    transactions.push(await deprecateTx(sysAddr));
    transactions = transactions.concat(
      await authorizeTxs(World, systemConfig.writeAccess, sysAddr, true)
    );
  }

  // todo: deploy new system now, + transfer owner (currently implemented in regular deploy script)

  transactions.push(await registerSystemTx(World, systemConfig, newAddr)); // registering new system
  transactions = transactions.concat(await authorizeTxs(World, systemConfig.writeAccess, newAddr)); // auth new system

  return transactions;
}

//////////////////
// INDIVIDUAL TXS

const authorizeTxs = async (
  World: WorldAddresses,
  compNames: string[],
  writer: string,
  revoke?: boolean
) => {
  if (compNames.length === 1 && compNames[0] === '*') {
    // authorize all components
    compNames = getDeployComponents().components.map((comp: any) => comp.comp);
  }

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

const registerSystemTx = async (World: WorldAddresses, sysConfig: any, newSysAddr: string) => {
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
      addr: newSysAddr,
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
