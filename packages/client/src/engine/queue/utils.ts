import { BaseProvider, JsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import { extractEncodedArguments } from '@mud-classic/utils';
import { BigNumber, BigNumberish, Overrides } from 'ethers';
import { defaultAbiCoder as abi } from 'ethers/lib/utils';

/**
 * Get the revert reason from a given transaction hash
 *
 * @param txHash Transaction hash to get the revert reason from
 * @param provider ethers Provider
 * @returns Promise resolving with revert reason string
 */
export async function getRevertReason(txHash: string, provider: BaseProvider): Promise<string> {
  // Decoding the revert reason: https://docs.soliditylang.org/en/latest/control-structures.html#revert
  const tx = await provider.getTransaction(txHash);
  // tx.gasPrice = undefined; // tx object contains both gasPrice and maxFeePerGas
  const encodedRevertReason = await provider.call(tx as TransactionRequest);
  const decodedRevertReason = abi.decode(['string'], extractEncodedArguments(encodedRevertReason));
  return decodedRevertReason[0];
}

export async function getTxGasData(
  provider: JsonRpcProvider,
  estimateGas: () => Promise<BigNumberish>
) {
  const estMaxFee = provider.send('eth_gasPrice', []);
  const estMaxPrioFee = provider.send('eth_maxPriorityFeePerGas', []);

  const gasOverrides: Overrides = {};
  await Promise.allSettled([estimateGas(), estMaxFee, estMaxPrioFee]).then((results) => {
    const gasLimit = results[0].status === 'fulfilled' ? results[0].value : BigNumber.from(0);
    const maxFeeRaw = results[1].status === 'fulfilled' ? results[1].value : 0;
    const maxPriorityFeeRaw = results[2].status === 'fulfilled' ? results[2].value : 0;

    const maxFee = BigNumber.from(maxFeeRaw);
    const maxPriorityFee = BigNumber.from(maxPriorityFeeRaw);
    const baseFee = maxFee.sub(maxPriorityFee);

    gasOverrides.gasLimit = gasLimit;
    gasOverrides.maxPriorityFeePerGas = maxPriorityFee;
    gasOverrides.maxFeePerGas = baseFee.mul(2).add(maxPriorityFee);
  });

  return gasOverrides;
}

export function isOverrides(obj: any): obj is Overrides {
  if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) return false;
  return (
    'nonce' in obj ||
    'type' in obj ||
    'accessList' in obj ||
    'customData' in obj ||
    'value' in obj ||
    'blockTag' in obj ||
    'from' in obj
  );
}
