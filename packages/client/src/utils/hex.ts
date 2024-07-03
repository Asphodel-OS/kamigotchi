import { BigNumber, BigNumberish } from 'ethers';

export const numberToHex = (n: BigNumberish) => {
  return BigNumber.from(n).toHexString();
};
