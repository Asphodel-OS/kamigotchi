import { baseGasPrice, DefaultChain } from 'constants/chains';
import {
  keccak256,
  Overrides,
  Provider,
  Signer,
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from 'ethers';
import { log } from 'utils/logger';

const SYNC_TX_TIMEOUT_MS = 15000;
const RECONCILE_MAX_MS = 60_000;
const RECONCILE_POLL_MS = 2_500;
const RECONCILE_JITTER_MS = 500;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function normalizeMessage(error: any): string {
  return `${error?.shortMessage || ''} ${error?.reason || ''} ${error?.message || ''}`.toLowerCase();
}

function toStatusNumber(status: any): number | undefined {
  if (status == null) return undefined;
  if (typeof status === 'number') return status;
  if (typeof status === 'bigint') return Number(status);
  if (typeof status === 'string') {
    if (status.startsWith('0x')) return Number.parseInt(status, 16);
    const asNum = Number(status);
    if (!Number.isNaN(asNum)) return asNum;
  }
  return undefined;
}

function toNonceNumber(nonce: any): number | undefined {
  if (nonce == null) return undefined;
  if (typeof nonce === 'number') return nonce;
  if (typeof nonce === 'bigint') return Number(nonce);
  if (typeof nonce === 'string') {
    if (nonce.startsWith('0x')) return Number.parseInt(nonce, 16);
    const asNum = Number(nonce);
    if (!Number.isNaN(asNum)) return asNum;
  }
  return undefined;
}

function isMethodUnsupportedError(error: any): boolean {
  const message = normalizeMessage(error);
  const deterministicPatterns = ['method not supported', 'is not available', 'method not found'];
  return (
    error?.code === -32601 || deterministicPatterns.some((pattern) => message.includes(pattern))
  );
}

function isDeterministicSubmissionError(error: any): boolean {
  const message = normalizeMessage(error);
  const deterministicPatterns = ['rejected', 'denied', 'nonce too low'];
  return deterministicPatterns.some((pattern) => message.includes(pattern));
}

function shouldReconcileSubmissionError(error: any): boolean {
  if (isMethodUnsupportedError(error)) return false;
  if (isDeterministicSubmissionError(error)) return false;

  const message = normalizeMessage(error);
  // Default to reconciliation for non-deterministic sync-send errors to avoid false negatives.
  return true;
}

async function getReceiptSafe(
  provider: Provider,
  txHash: string
): Promise<TransactionReceipt | null> {
  try {
    return await provider.getTransactionReceipt(txHash);
  } catch {
    return null;
  }
}

async function getTxByHashSafe(
  provider: Provider,
  txHash: string
): Promise<TransactionResponse | null> {
  try {
    return await provider.getTransaction(txHash);
  } catch {
    return null;
  }
}

function txMatches(tx: any, txHash: string, nonce: number | undefined) {
  if (!tx || typeof tx !== 'object') return false;

  if (typeof tx.hash === 'string' && tx.hash.toLowerCase() === txHash.toLowerCase()) return true;

  if (nonce != null) {
    const txNonce = toNonceNumber(tx.nonce);
    if (txNonce != null && txNonce === nonce) return true;
  }

  return false;
}

function containsTxInPoolNode(node: any, txHash: string, nonce: number | undefined): boolean {
  if (!node) return false;
  if (Array.isArray(node)) return node.some((entry) => containsTxInPoolNode(entry, txHash, nonce));
  if (typeof node !== 'object') return false;

  if (txMatches(node, txHash, nonce)) return true;
  return Object.values(node).some((value) => containsTxInPoolNode(value, txHash, nonce));
}

async function isTxInPoolFrom(
  provider: Provider,
  from: string | undefined,
  txHash: string,
  nonce: number | undefined
): Promise<{ supported: boolean; inPool: boolean }> {
  if (!from) return { supported: false, inPool: false };

  try {
    const pool = await (provider as any).send('txpool_contentFrom', [from]);
    const pendingMatch = containsTxInPoolNode(pool?.pending, txHash, nonce);
    const queuedMatch = containsTxInPoolNode(pool?.queued, txHash, nonce);
    const fallbackMatch =
      !pendingMatch && !queuedMatch ? containsTxInPoolNode(pool, txHash, nonce) : false;
    return { supported: true, inPool: pendingMatch || queuedMatch || fallbackMatch };
  } catch (error: any) {
    if (isMethodUnsupportedError(error)) return { supported: false, inPool: false };
    return { supported: true, inPool: false };
  }
}

async function reconcileSubmittedTx(
  provider: Provider,
  params: {
    txHash: string;
    from?: string;
    nonce?: number;
    maxMs?: number;
    pollMs?: number;
    jitterMs?: number;
  }
): Promise<TransactionReceipt> {
  const { txHash, from, nonce } = params;
  const maxMs = params.maxMs ?? RECONCILE_MAX_MS;
  const pollMs = params.pollMs ?? RECONCILE_POLL_MS;
  const jitterMs = params.jitterMs ?? RECONCILE_JITTER_MS;
  const startedAt = Date.now();
  const deadline = startedAt + maxMs;

  let seenInPool = false;

  log.warn('[queue] Starting tx reconciliation', { txHash, from, nonce, maxMs });

  while (Date.now() < deadline) {
    const receipt = await getReceiptSafe(provider, txHash);
    if (receipt) {
      const status = toStatusNumber((receipt as any).status);
      if (status === 0) {
        const error = new Error(`Transaction failed with status ${(receipt as any).status}`);
        (error as any).receipt = receipt;
        (error as any).transactionHash = txHash;
        throw error;
      }

      log.info('[queue] Reconciliation success (receipt found)', {
        txHash,
        elapsedMs: Date.now() - startedAt,
      });
      return receipt;
    }

    const tx = await getTxByHashSafe(provider, txHash);
    const txByHashFound = !!tx;

    const poolProbe = await isTxInPoolFrom(provider, from, txHash, nonce);
    if (poolProbe.inPool) {
      seenInPool = true;
    }

    log.debug('[queue] Reconciliation probe', {
      txHash,
      txByHashFound,
      poolSupported: poolProbe.supported,
      inPool: poolProbe.inPool,
      elapsedMs: Date.now() - startedAt,
    });

    const jitter = jitterMs > 0 ? Math.floor(Math.random() * jitterMs) : 0;
    await sleep(pollMs + jitter);
  }

  const elapsedMs = Date.now() - startedAt;
  const error = new Error(
    seenInPool
      ? 'Transaction stuck in mempool >60s'
      : 'Transaction not found in pool/chain after 60s'
  );
  (error as any).code = 'TX_RECONCILE_TIMEOUT';
  (error as any).transactionHash = txHash;
  (error as any).seenInPool = seenInPool;
  (error as any).elapsedMs = elapsedMs;
  throw error;
}

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

  log.time.info('[queue] Signing tx');
  let signedTx, txHash, from, nonce;

  try {
    signedTx = await signer.signTransaction(txData);
    txHash = keccak256(signedTx);
    from = await signer.getAddress().catch(() => undefined);
    nonce = toNonceNumber(txData.nonce);

    log.time.info(`[queue] Sending tx (sync) ${txHash}`);
    const sendStart = performance.now();
    const receipt = (await (signer.provider as any).send('eth_sendRawTransactionSync', [
      signedTx,
      SYNC_TX_TIMEOUT_MS,
    ])) as TransactionReceipt;
    const sendDuration = performance.now() - sendStart;
    log.time.info(`[queue] Got receipt (took ${sendDuration.toFixed(0)}ms)`);

    const status = toStatusNumber((receipt as any).status);

    if (status !== 1) {
      const error = new Error(`Transaction failed with status ${receipt.status}`);
      (error as any).receipt = receipt;
      throw error;
    }

    return receipt;
  } catch (e: any) {
    if (shouldResetNonce(e)) {
      throw e;
    }
    if (isMethodUnsupportedError(e)) {
      log.time.info('[queue] eth_sendRawTransactionSync not supported, using legacy path');
      const response = await signer.sendTransaction(txData);
      const receipt = await response.wait();
      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }
      return receipt;
    }

    if (shouldReconcileSubmissionError(e)) {
      return reconcileSubmittedTx(signer.provider, { txHash, from, nonce });
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
