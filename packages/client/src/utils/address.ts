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

export const getAbbreviatedAddress = (
  address: string,
  prefix: boolean = false,
  suffix: boolean = true
): string => {
  if (!address) return '';

  let display = '0x';
  if (prefix) display += address.slice(2, 6);
  if (suffix) display += `..${address.slice(-4)}`;
  return display;
};
