import { awaitValue, cacheUntilReady } from '@mud-classic/utils';
import { Mutex } from 'async-mutex';
import {
  BigNumberish,
  FunctionFragment,
  Overrides,
  TransactionReceipt,
  TransactionRequest,
} from 'ethers';
import { IComputedValue, IObservableValue, autorun, computed, observable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { Network } from 'engine/executors';
import { ConnectionState } from 'engine/providers';
import { Contracts } from 'engine/types';
import { deferred } from 'utils/async';
import { log } from 'utils/logger';
import { createPriorityQueue } from './priorityQueue';
import { TxQueue } from './types';
import { isOverrides, sendTx, shouldIncNonce, shouldResetNonce } from './utils';

import { GasEstimationCache } from './gasCache';

export const MAX_NONCE_RETRIES = 1; // Retry nonce errors exactly once

type ReturnTypeStrict<T> = T extends (...args: any) => any ? ReturnType<T> : never;

type TxResult = {
  hash: string;
  wait: () => Promise<TransactionReceipt>;
  response: Promise<any>;
};

/**
 * The TxQueue takes care of nonce management, concurrency and caching calls if the contracts are not connected.
 * Cached calls are passed to the queue once the contracts are available.
 *
 * @param computedContracts A computed object containing the contracts to be channelled through the txQueue
 * @param network A network object containing provider, signer, etc
 * @param options The concurrency declares how many transactions can wait for confirmation at the same time.
 * @returns TxQueue object
 */
export function create<C extends Contracts>(
  computedContracts: IComputedValue<C> | IObservableValue<C>,
  network: Network
): {
  txQueue: TxQueue;
  dispose: () => void;
  ready: IComputedValue<boolean | undefined>;
} {
  type QueueItem = {
    execute: (txOverrides: Overrides) => Promise<TxResult>;
    estimateGas: () => Promise<BigNumberish>;
    resolve: (result: TxResult) => void;
    reject: (error: Error) => void;
    cacheKey?: string;
  };

  const queue = createPriorityQueue<QueueItem>();
  const submissionMutex = new Mutex();
  const _nonce = observable.box<number | null>(null);

  const gasCache = new GasEstimationCache();

  const readyState = computed(() => {
    const connected = network.connected.get();
    const contracts = computedContracts.get();
    const signer = network.signer;
    const provider = network.providers.get()?.json;
    const nonce = _nonce.get();

    if (
      connected !== ConnectionState.CONNECTED ||
      !contracts ||
      !signer ||
      !provider ||
      nonce == null
    )
      return undefined;

    return { contracts, signer, provider, nonce };
  });

  async function resetNonce() {
    runInAction(() => _nonce.set(null));
    const newNonce = (await network.signer?.getNonce()) ?? null;
    runInAction(() => _nonce.set(newNonce));
  }

  // Set the nonce on init and reset if the signer changed
  const dispose = autorun(resetNonce);

  // increment the nonce
  function incNonce() {
    runInAction(() => {
      const currentNonce = _nonce.get();
      const newNonce = currentNonce == null ? null : currentNonce + 1;
      _nonce.set(newNonce);
    });
  }

  function logTxError(label: string, error: any, txHash?: string) {
    const revertReason = error?.reason || error?.revert?.name;
    log.warn(`[TXQueue] ${label}`, {
      code: error?.code,
      message: error?.message,
      reason: revertReason,
      shortMessage: error?.shortMessage,
      ...(txHash && { txHash }),
    });
  }

  // Execute tx with retry on nonce errors. Returns result or throws final error.
  async function executeTxWithRetry(
    execute: (txOverrides: Overrides) => Promise<TxResult>,
    txOverrides: Overrides
  ): Promise<TxResult> {
    let retryCount = 0;

    while (retryCount <= MAX_NONCE_RETRIES) {
      try {
        return await execute(txOverrides);
      } catch (error: any) {
        log.warn(`[TXQueue] EXECUTION FAILED ${error}`);

        const isNonceError = shouldResetNonce(error);
        const canRetry = isNonceError && retryCount < MAX_NONCE_RETRIES;

        if (canRetry) {
          log.warn('[TXQueue] NONCE ERROR detected', {
            code: error?.code,
            message: error?.message,
            retryCount,
          });
          await resetNonce();
          retryCount++;
          log.info(`[TXQueue] Retrying transaction (attempt ${retryCount}/${MAX_NONCE_RETRIES})`);

          const { nonce: freshNonce } = await awaitValue(readyState);
          txOverrides.nonce = freshNonce;
          continue;
        }

        // Non-retryable or retries exhausted
        if (isNonceError) {
          log.warn(`[TXQueue] Nonce retry exhausted (${MAX_NONCE_RETRIES}), failing transaction`);
          await resetNonce();
        } else if (shouldIncNonce(error)) {
          incNonce();
        }
        throw error;
      }
    }

    // Should never reach here, but TypeScript needs it
    throw new Error('Unexpected retry loop exit');
  }

  async function queueCall(
    txRequest: TransactionRequest,
    callOverrides?: Overrides,
    cacheKey?: string
  ): Promise<TxResult> {
    const [resolve, reject, promise] = deferred<TxResult>();
    const { signer } = await awaitValue(readyState);

    const estimateGas = async (): Promise<BigNumberish> => {
      if (callOverrides?.gasLimit) {
        log.debug(`[estimateGas] Using callOverride ${callOverrides.gasLimit}`);
        return callOverrides.gasLimit;
      }

      if (cacheKey) {
        const cached = gasCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      try {
        log.debug('[estimateGas] Simulating transaction');
        const gasEstimate = await signer!.estimateGas(txRequest);
        if (cacheKey) {
          gasCache.set(cacheKey, gasEstimate);
        }
        return gasEstimate;
      } catch (error) {
        throw error;
      }
    };

    const execute = async (txOverrides: Overrides): Promise<TxResult> => {
      const populatedTx = { ...txRequest, ...txOverrides, ...callOverrides };
      const tx = await sendTx(signer, populatedTx!);
      if (!tx) {
        throw new Error('Failed to send transaction: signer missing or sendTx returned undefined');
      }
      const hash = tx.hash;
      log.debug(`[TXQueue] TX Sent ${tx.hash}`);
      const wait = async () => {
        const receipt = await tx.wait();
        if (!receipt) throw new Error('tx receipt null');
        return receipt;
      };
      const response = Promise.resolve(tx);
      return { hash, wait, response };
    };

    queue.add(uuid(), { execute, estimateGas, resolve, reject, cacheKey });
    processQueue();
    return promise;
  }

  async function processQueue() {
    const queueItem = queue.next();
    if (!queueItem) return;
    processQueue(); // Start processing another request from the queue
    const txResult = await submissionMutex.runExclusive(async () => {
      // Estimate gas and get nonce
      let txOverrides: Overrides = {};
      try {
        const { nonce } = await awaitValue(readyState);
        txOverrides.nonce = nonce;
        txOverrides.gasLimit = await queueItem.estimateGas();
      } catch (e: any) {
        log.warn('[processQueue] Gas estimation failed using default gas limit');
        txOverrides.gasLimit = 6_000_000n;
        //queueItem.reject(e as Error);
        //return;
      }
      // Execute with retry on nonce errors
      try {
        const result = await executeTxWithRetry(queueItem.execute, txOverrides);
        queueItem.resolve(result);
        incNonce();
        return { hash: result.hash, wait: result.wait };
      } catch (e) {
        queueItem.reject(e as Error);
        if (queueItem.cacheKey) {
          gasCache.delete(queueItem.cacheKey);
        }
      }
    });

    // Await confirmation
    if (txResult?.hash) {
      try {
        const tx = await txResult.wait();
        log.info('[TXQueue] TX Confirmed', tx);
      } catch (e: any) {
        logTxError('TX FAILED', e, txResult?.hash);
        if (queueItem.cacheKey) {
          gasCache.delete(queueItem.cacheKey);
        }
        return;
      }
    }

    processQueue();
  }

  // queue up a system call in the txQueue
  async function queueCallSystem(
    systemName: string,
    target: C[keyof C],
    prop: keyof C[keyof C],
    args: unknown[]
  ): Promise<{
    hash: string;
    wait: () => Promise<TransactionReceipt>;
    response: Promise<ReturnTypeStrict<(typeof target)[typeof prop]>>;
  }> {
    // Extract existing overrides from function call
    const hasOverrides = args.length > 0 && isOverrides(args[args.length - 1]);
    const callOverrides = (hasOverrides ? args[args.length - 1] : {}) as Overrides;
    const argsWithoutOverrides = hasOverrides ? args.slice(0, args.length - 1) : args;

    const cacheKey = gasCache.generateKey(systemName, prop.toString(), argsWithoutOverrides);

    const fn = target.getFunction(prop.toString());
    const populatedTx = await fn.populateTransaction(...argsWithoutOverrides);
    return queueCall(populatedTx, callOverrides, cacheKey);
  }

  // wraps contract call with txQueue
  function proxyContract<Contract extends C[keyof C]>(
    systemName: string,
    contract: any
  ): any extends Contract ? any : never {
    const methods: string[] = [];
    contract.interface.forEachFunction((func: FunctionFragment) => methods.push(func.name));
    methods.forEach((method) => {
      contract[method] = (...args: unknown[]) =>
        queueCallSystem(systemName, contract, method, args);
    });
    return contract;
  }
  const proxiedContracts = computed(() => {
    const contracts = readyState.get()?.contracts;
    if (!contracts) return undefined;

    const result: Record<string, any> = {};
    for (const [systemName, contract] of Object.entries(contracts)) {
      result[systemName] = proxyContract(systemName, contract);
    }
    return result as C;
  });

  const cachedProxiedContracts = cacheUntilReady(proxiedContracts);

  return {
    txQueue: {
      call: queueCall, // call tx directly
      systems: cachedProxiedContracts,
    },
    dispose,
    ready: computed(() => (readyState ? true : undefined)),
  };
}
