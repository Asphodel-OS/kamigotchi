import { Wallet } from 'ethers';

export const generatePrivateKey = (): string => {
  const wallet = Wallet.createRandom();
  return wallet.privateKey;
};

export const getAddressFromPrivateKey = (privateKey: string): string => {
  let address = '';
  try {
    const wallet = new Wallet(privateKey);
    address = wallet.address.toLowerCase();
  } catch (e) {}
  return address;
};
