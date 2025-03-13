import { ethers } from 'ethers';
import { Address, erc20Abi } from 'viem';
import { useReadContracts } from 'wagmi';

import { parseTokenBalance } from 'utils/numbers';

export function useBalance(address: Address, token: Address, spender: Address) {
  const erc20 = {
    address: token,
    abi: erc20Abi,
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
export function approve(addToQueue: any, token: string, spender: string, amount: BigInt) {
  const iERC20 = new ethers.utils.Interface(erc20Abi);
  return addToQueue({
    data: iERC20.encodeFunctionData('approve', [spender, amount]),
    to: token,
  });
}

// game balance (mToken, 1e3) to whole token (ether, 1)
export function toERC20DisplayUnits(amt: number) {
  return amt / 1e3;
}
