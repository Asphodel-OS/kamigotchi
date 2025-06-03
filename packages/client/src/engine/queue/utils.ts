import { BaseProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { extractEncodedArguments } from '@mud-classic/utils';
import { baseGasPrice, DefaultChain } from 'constants/chains';
import { Overrides, Signer } from 'ethers';
import { defaultAbiCoder as abi, Deferrable } from 'ethers/lib/utils';

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

export async function waitForTx(txResponse: Promise<TransactionResponse>) {
  const response = await txResponse;
  if (response == null) {
    // todo: review upon mainnet launch
    /**
     * Issue: tx response can be null if tx is yet pending or indexed. (tx is unknown, or not in mempool)
     * Issue is caused by RPC. Review again with new mainnet version, should be fixed.
     * If necessary, add a wait and try again
     */
    console.warn('tx response null');
  }
  return response.wait();
}

/**
 * Performant send tx, reducing as many calls as possible
 * gasLimit is already estimated in prior step, passed in via txData
 */
export async function sendTx(
  signer: Signer | undefined,
  txData: Deferrable<TransactionRequest>
): Promise<TransactionResponse> {
  txData.chainId = DefaultChain.id;
  txData.maxFeePerGas = baseGasPrice; // gas prices for minievm are fixed
  txData.maxPriorityFeePerGas = 0;
  return signer?.sendTransaction(txData)!;
}

// check if nonce should be incremented
export function shouldIncNonce(error: any) {
  // If tx was submitted, inc nonce regardless of error
  const isMutationError = !!error?.transaction;
  const isRejectedError = error?.reason?.includes('user rejected transaction'); //
  return !isRejectedError && (!error || isMutationError);
}

export function shouldResetNonce(error: any) {
  const isExpirationError = error?.code === 'NONCE_EXPIRED';
  const isRepeatError = error?.reason?.includes('transaction already imported');
  // miniEVM currently returns "processing response error" instead of "NONCE_EXPIRED"
  const isRepeatError2 = error?.reason?.includes('processing response error');
  return isExpirationError || isRepeatError || isRepeatError2;
}

export function isOverrides(obj: any): obj is Overrides {
  if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) return false;
  return (
    'gasLimit' in obj ||
    'gasPrice' in obj ||
    'maxFeePerGas' in obj ||
    'maxPriorityFeePerGas' in obj ||
    'nonce' in obj ||
    'type' in obj ||
    'accessList' in obj ||
    'customData' in obj ||
    'value' in obj ||
    'blockTag' in obj ||
    'from' in obj
  );
}
