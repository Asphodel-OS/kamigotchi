import { BigNumber, BigNumberish } from 'ethers';

export const numberToHex = (n: BigNumberish) => {
  return BigNumber.from(n).toHexString();
};

export const uint8ArrayToHexString = (data: Uint8Array): string => {
  if (data.length === 0) return '0x00';
  let hex = data.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
  if (hex.substring(0, 2) == '0x') hex = hex.substring(2);
  const prefix = hex.length % 2 !== 0 ? '0x0' : '0x';
  return prefix + hex;
};
