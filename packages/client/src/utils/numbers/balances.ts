import { formatUnits } from 'viem';

export const parseTokenBalance = (balance: bigint = BigInt(0), decimals: number = 18) => {
  const formatted = formatUnits(balance, decimals);
  return Number(formatted);
};
