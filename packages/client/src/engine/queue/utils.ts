import { baseGasPrice, DefaultChain } from 'constants/chains';
import {
  Overrides,
  Provider,
  Signer,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from 'ethers';
import { log } from 'utils/logger';

/**
 * Get the revert reason from a failed transaction using debug_traceTransaction.
 *
 * NOTE: Requires RPC provider to support debug_traceTransaction (geth debug API).
 * Many public providers disable this. If unsupported, callers should fall back
 * to extracting error info from the exception object.
 *
 * @param txHash Transaction hash (0x prefixed)
 * @param provider ethers Provider with debug API support
 * @returns Promise resolving with revert reason string, or undefined if not found
 * @throws Error if debug_traceTransaction is not supported by the provider
 */
export async function getRevertReason(
  txHash: string,
  provider: Provider
): Promise<string | undefined> {
  const result = await (provider as any).send('debug_traceTransaction', [
    txHash,
    { tracer: 'callTracer' },
  ]);

  const revertReason = result?.revertReason || result?.error || result?.output;
  if (!revertReason) return undefined;

  return revertReason;
}

export async function waitForTx(
  txResponse: Promise<TransactionResponse | null>
): Promise<TransactionReceipt> {
  const response = await txResponse;
  if (response == null) {
    /**
     * Issue: tx response can be null if tx is yet pending or indexed. (tx is unknown, or not in mempool)
     * Issue is caused by RPC. Review again with new mainnet version, should be fixed.
     * If necessary, add a wait and try again
     */
    console.warn('tx response null');
    // todo: ethersv6 migration - review error handling
    throw new Error('tx response null');
  }

  const receipt = await response.wait();
  if (receipt == null) {
    // todo: ethersv6 migration - review error handling
    throw new Error('tx response null');
  }
  return receipt; // confirmations >0, so wait() will never return null
}

/**
 * Performant send tx, reducing as many calls as possible
 * gasLimit is already estimated in prior step, passed in via txData
 *
 * Tries EIP-7966 eth_sendRawTransactionSync first for faster confirmation,
 * falls back to legacy sendTransaction if the RPC doesn't support it.
 */
export async function sendTx(
  signer: Signer | undefined,
  txData: TransactionRequest
): Promise<TransactionReceipt> {
  if (!signer) {
    throw new Error('Signer required');
  }
  if (!signer.provider) {
    throw new Error('Provider required');
  }

  txData.chainId = DefaultChain.id;
  txData.maxFeePerGas = baseGasPrice;
  txData.maxPriorityFeePerGas = 0;

  //if (signer instanceof Wallet) {
  try {
    log.time.info('[queue] Signing tx');
    const signedTx = await signer.signTransaction(txData);
    log.time.info('[queue] Sending tx (sync)');
    const sendStart = performance.now();
    const receipt = await (signer.provider as any).send('eth_sendRawTransactionSync', [
      signedTx,
      8000,
    ]);
    const sendDuration = performance.now() - sendStart;
    log.time.info(`[queue] Got receipt (took ${sendDuration.toFixed(0)}ms)`);

    const status =
      typeof receipt.status === 'string' ? parseInt(receipt.status, 16) : receipt.status;

    if (status !== 1) {
      const error = new Error(`Transaction failed with status ${receipt.status}`);
      (error as any).receipt = receipt;
      throw error;
    }

    return receipt;
  } catch (e: any) {
    if (e?.message?.includes('Method not supported') || e?.message?.includes('is not available')) {
      log.time.info('[queue] eth_sendRawTransactionSync not supported, using legacy path');
      const response = await signer.sendTransaction(txData);
      const receipt = await response.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      return receipt;
    }
    throw e;
  }
  /*}

  log.time.info('[queue] Sending tx via wallet');
  const response = await signer.sendTransaction(txData);
  const receipt = await response.wait();
  if (!receipt) {
    throw new Error('Transaction receipt is null');
  }
  return receipt;*/
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
  const isRepeatError = error?.message?.includes('account sequence');
  const isReplacedError = error?.code === 'TRANSACTION_REPLACED';
  return isExpirationError || isRepeatError || isReplacedError;
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
