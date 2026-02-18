import { ethers } from 'ethers';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';

// special function for kami721s. potentially replace with rpc api calls
export function useBalance(owner: Address, token: Address) {
  const kami721 = {
    address: token,
    abi: erc721ABI,
  };
  const results = useReadContracts({
    contracts: [{ ...kami721, functionName: 'getAllTokens', args: [owner] }],
  });
  return {
    ...results,
    tokenIndices:
      results.data && Array.isArray(results.data[0].result)
        ? results.data[0].result.map((i) => Number(i))
        : [],
  };
}

// uses ethersjs for RECS compatibility
export function setApprovalForAll(
  addToQueue: any,
  token: string,
  operator: string,
  approved: boolean
) {
  const iERC721 = new ethers.Interface(erc721ABI);
  return addToQueue({
    data: iERC721.encodeFunctionData('setApprovalForAll', [operator, approved]),
    to: token,
  });
}

////////////////
// INTERNALS

export const erc721ABI = [
  {
    name: 'getAllTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'tokenIDs',
        type: 'uint256[]',
      },
    ],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
    ],
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    outputs: [],
  },
];
