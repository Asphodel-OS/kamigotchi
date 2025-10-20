import { useTokens } from 'app/stores';
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

// check whether user has eth balance, skip check on local
const IS_LOCAL = import.meta.env.MODE === 'puter';

export const hasEth = () => {
  const ethBalance = useTokens((s) => s.eth.balance);
  return IS_LOCAL || ethBalance > 0;
};
