import { JsonRpcProvider, Provider } from '@ethersproject/providers';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

///////////////
// SIGNERS AND PROVIDERS

export const getProvider = (): Provider => {
  return new JsonRpcProvider(process.env.RPC!);
};

export const getSigner = async (): Promise<ethers.Wallet> => {
  return new ethers.Wallet(process.env.PRIV_KEY!, getProvider());
};
