import { BigNumberish, ethers } from 'ethers';

import { parseTokenBalance } from 'utils/numbers';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { preAssetAbi } from './abi';

export function usePresaleInfo(address: Address, presaleAddr: Address) {
  const preAsset = {
    address: presaleAddr,
    abi: preAssetAbi,
  };
  const results = useReadContracts({
    contracts: [
      { ...preAsset, functionName: 'depositCap', args: [] }, // total cap
      { ...preAsset, functionName: 'totalDeposits', args: [] }, // total currently bought
      { ...preAsset, functionName: 'price', args: [] }, // price
      { ...preAsset, functionName: 'whitelist', args: [address] }, // allo
      { ...preAsset, functionName: 'deposits', args: [address] }, // user deposits
    ],
  });
  return {
    ...results,
    data: {
      depositCap: parseTokenBalance(results.data?.[0]?.result as bigint, 18),
      totalDeposits: parseTokenBalance(results.data?.[1]?.result as bigint, 18),
      price: Number(results.data?.[2]?.result as bigint),
      allo: parseTokenBalance(results.data?.[3]?.result as bigint, 18),
      bought: parseTokenBalance(results.data?.[4]?.result as bigint, 18),
    },
  };
}

// uses ethersjs for RECS compatibility
export function presaleDeposit(addToQueue: any, presaleAddr: string, amount: BigNumberish) {
  const iPreAsset = new ethers.utils.Interface(preAssetAbi);
  return addToQueue({
    data: iPreAsset.encodeFunctionData('whitelistDeposit', [amount]),
    to: presaleAddr,
  });
}
