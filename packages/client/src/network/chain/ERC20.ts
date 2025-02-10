import { ethers } from 'ethers';
import { parseTokenBalance } from 'utils/balances';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { abi } from './abi/erc20';

export function useBalance(address: Address, token: Address, spender?: Address) {
  const erc20 = {
    address: token,
    abi: abi,
  };
  const results = useReadContracts({
    contracts: [
      { ...erc20, functionName: 'balanceOf', args: [address] },
      { ...erc20, functionName: 'allowance', args: [address, spender] },
    ],
  });
  return {
    ...results,
    balances: {
      allowance: parseTokenBalance(results.data?.[1]?.result as bigint, 18),
      balance: parseTokenBalance(results.data?.[0]?.result as bigint, 18),
    },
  };
}

// uses ethersjs for RECS compatibility
export function approve(addToQueue: any, token: string, spender: string) {
  const iERC20 = new ethers.utils.Interface(abi);
  return addToQueue({
    data: iERC20.encodeFunctionData('approve', [spender, ethers.constants.MaxUint256]),
    to: token,
  });
}
