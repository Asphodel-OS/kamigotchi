import { JsonRpcProvider, Provider } from '@ethersproject/providers';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();

///////////////
// .env UTILS

export const getDeployerKey = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_DEPLOYER_PRIV;
  else return process.env.DEV_DEPLOYER_PRIV;
};

export const getMultisig = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_MULTISIG;
  else return process.env.DEV_MULTISIG;
};

export const getRpc = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_RPC;
  else return process.env.DEV_RPC;
};

export const getWorld = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_WORLD;
  else return process.env.DEV_WORLD;
};

///////////////
// SIGNERS AND PROVIDERS

export const getProvider = (mode: string): Provider => {
  return new JsonRpcProvider(getRpc(mode)!);
};

export const getSigner = async (mode: string): Promise<ethers.Wallet> => {
  return new ethers.Wallet(getDeployerKey(mode)!, getProvider(mode));
};
