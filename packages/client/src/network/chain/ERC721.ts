import { Address } from 'viem';
import { useReadContracts } from 'wagmi';

// special function for kami721s. potentially replace with rpc api calls
export function useBalance(owner: Address, token: Address) {
  const kami721 = {
    address: token,
    abi: abi,
  };
  const results = useReadContracts({
    contracts: [{ ...kami721, functionName: 'getAllTokens', args: [owner] }],
  });
  return {
    ...results,
    tokenIndices: results.data?.[0].result?.map((i: any) => Number(i)),
  };
}

////////////////
// INTERNALS

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'getAllTokens',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
