import { BigNumber, Wallet, utils } from 'ethers';
import { Address, padHex } from 'viem';

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

export const abbreviateAddress = (
  address: string,
  prefix: boolean = true,
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
  a1 = utils.hexZeroPad(BigNumber.from(a1).toHexString(), 20);
  a2 = utils.hexZeroPad(BigNumber.from(a2).toHexString(), 20);
  return a1 === a2;
};

export const parseAddress = (raw: string): Address | undefined => {
  if (raw.search('0x') !== 0) {
    console.warn(`parseAddress() invalid address format: ${raw}`);
    return undefined;
  }
  return padHex(raw as `0x${string}`, { size: 20 });
  // return getAddress(padded, DefaultChain.id); // doesnt seem to pass checksum
};
