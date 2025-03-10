import {
  CallContractTransactionInput,
  encodeMulti,
  encodeSingle,
  MetaTransaction,
  TransactionType,
} from 'ethers-multisend';
import { Interface } from 'ethers/lib/utils';

import { SystemABI, UintCompABI, WorldABI } from '../../contracts/mappings/worldABIs';
import {
  getCompIDByName,
  getDeploySystems,
  getSystemIDByName,
  keccak256,
  WorldAddresses,
} from '../../utils';
import { writeBatchTx } from './utils/write';

genBatchTx('DEV', 'AccountMoveSystem');

async function genBatchTx(mode: string, systems: string) {
  const World = new WorldAddresses(mode);

  // assume only 1 system for now !!
  const deployConfig = getDeploySystems(systems);
  const sysConfig = deployConfig.systems[0];

  let transactions: MetaTransaction[] = [];
  // checking for prev system, deprecate if so
  let sysAddr = (await World.getSysAddr(getSystemIDByName(sysConfig.name))) || '0';
  if (Number(sysAddr) !== 0) {
    // transactions.push(await deprecateTx(sysAddr));
    transactions = transactions.concat(
      await authorizeTxs(World, sysConfig.writeAccess, sysAddr, true)
    );
  }
  // todo: deploy new system now, + transfer owner
  // transactions.push(await registerSystemTx(World, sysConfig)); // registering new system
  // authorize new system
  // transactions = transactions.concat(await authorizeTxs(World, sysConfig.writeAccess, sysAddr));

  // write file
  const batchJson = encodeMulti(transactions, '0xDaF87da790ECa0eD52211C0305b93b3086D15868');
  writeBatchTx(batchJson);
}

const authorizeTxs = async (
  World: WorldAddresses,
  compNames: string[],
  writer: string,
  revoke?: boolean
) => {
  const txs: MetaTransaction[] = [];
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
  const abi = getCompMethod(revoke);
  console.log(new Interface(JSON.stringify([abi])));
  return encodeSingle({
    type: TransactionType.callContract,
    id: '',
    to: (await World.getCompAddr(compID))!,
    value: '0',
    abi: JSON.stringify([abi]),
    functionSignature: `${revoke ? 'unauthorizeWriter' : 'authorizeWriter'}(address)`, // both args the same, hardcode
    inputValues: [writer],
  } as CallContractTransactionInput);
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
  return `function ${func}(address writer)`;
  return {
    name: func,
    inputs: JSON.stringify(raw!.inputs),
    payable: false,
  };
};
