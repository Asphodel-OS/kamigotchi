import { formatEntityID } from 'engine/utils';
import { BigNumber } from 'ethers';

export const parseID = (id: string) => {
  return formatEntityID(BigNumber.from(id));
};

export const abbreviateString = (str: string, maxLength = 16) => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};
