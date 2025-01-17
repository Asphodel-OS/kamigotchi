import { JsonRpcProvider, Provider } from '@ethersproject/providers';
import { BigNumberish, ethers } from 'ethers';

import { UintCompABI, WorldABI } from './abis';

///////////////
// .env UTILS

export const getDeployerKey = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_DEPLOYER_PRIV;
  else return process.env.DEV_DEPLOYER_PRIV;
};

export const getRpc = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_RPC;
  else return process.env.DEV_RPC;
};

export const getWorld = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_WORLD;
  else return process.env.DEV_WORLD;
};

export const setAutoMine = async (on: boolean) => {
  console.log(`** Setting automine to ${on} **`);
  const provider = new JsonRpcProvider(process.env.DEV_RPC!);
  await provider.send(`${on ? 'anvil_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
};

export const setTimestamp = async (ts: number = Math.floor(Date.now() / 1000)) => {
  console.warn(`** Setting timestamp to ${ts} **`);
  const provider = new JsonRpcProvider(process.env.DEV_RPC!);
  await provider.send('evm_setNextBlockTimestamp', [ts]);
};

///////////////
// SIGNERS AND PROVIDERS

export const getProvider = (mode: string): Provider => {
  return new JsonRpcProvider(getRpc(mode)!);
};

export const getSigner = async (mode: string): Promise<ethers.Wallet> => {
  return new ethers.Wallet(getDeployerKey(mode)!, getProvider(mode));
};

///////////////
// SOLECS

export const getAddrByID = async (
  provider: Provider,
  compsAddr: string,
  id: BigNumberish
): Promise<string> => {
  const comp = new ethers.Contract(compsAddr, UintCompABI, provider);
  const values = await comp.getEntitiesWithValue(id);
  return values.length > 0 ? values[0].toHexString() : '0x0000000000000000000000000000000000000000';
};

export const getSystemAddr = async (mode: string, strID: string): Promise<string> => {
  const provider = getProvider(mode);
  const world = new ethers.Contract(getWorld(mode)!, WorldABI, provider);
  const systemRegistry = await world.systems();

  const id = ethers.utils.solidityKeccak256(['string'], [strID]);
  return await getAddrByID(provider, systemRegistry, id);
};

///////////////
// FORGE CALLING

export const ignoreSolcErrors = [
  '--ignored-error-codes',
  '6321',
  '--ignored-error-codes',
  '5740',
  '--ignored-error-codes',
  '5667',
  '--ignored-error-codes',
  '2072',
  '--ignored-error-codes',
  '2018',
];

export const parseCompTypeDef = (type: string, override?: string): string => {
  if (override) type = override;
  const defBool = ['bool'];
  const defStat = ['Stat'];
  const defString = ['string', 'address', 'Coord'];
  const defNumber = ['uint32', 'uint256', 'int32', 'int256', 'number'];

  const isArray = type.includes('[]');
  if (isArray) type = type.replace('[]', '');

  let definer: string = '';
  if (defBool.includes(type)) definer = 'Bool';
  else if (defStat.includes(type)) definer = 'Stat';
  else if (defString.includes(type)) definer = 'String';
  else if (defNumber.includes(type)) definer = 'Number';
  else if (type === 'TimelockOp') definer = 'Timelock';

  return 'define' + definer + (isArray ? 'Array' : '') + 'Component';
};
