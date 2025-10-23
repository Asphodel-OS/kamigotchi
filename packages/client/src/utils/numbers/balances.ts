import { formatUnits } from 'viem';

export const parseTokenBalance = (balance: bigint = BigInt(0), decimals: number = 18) => {
  const formatted = formatUnits(balance, decimals);
  return Number(formatted);
};

// rounds to a certain number of decimals
export const round = (num: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
};
