import { BigNumber, Wallet, utils } from 'ethers';

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

export const addressesMatch = (a1: string, a2: string) => {
  if (!a1 || !a2) return false;
  console.log(a1, a2);
  a1 = utils.hexZeroPad(BigNumber.from(a1).toHexString(), 20);
  a2 = utils.hexZeroPad(BigNumber.from(a2).toHexString(), 20);
  console.log(a1, a2);
  return a1 === a2;
};
