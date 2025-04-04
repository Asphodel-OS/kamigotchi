import { TransactionReceipt, TransactionRequest } from '@ethersproject/providers';
import { awaitValue, cacheUntilReady, mapObject } from '@mud-classic/utils';
import { Mutex } from 'async-mutex';
import { BaseContract, BigNumberish, CallOverrides, Overrides } from 'ethers';
import { IComputedValue, IObservableValue, autorun, computed, observable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { Network } from 'engine/executors';
import { ConnectionState } from 'engine/providers';
import { Contracts } from 'engine/types';
import { deferred } from 'utils/async';
import { createPriorityQueue } from './priorityQueue';
import { TxQueue } from './types';
import { isOverrides, sendTx, shouldIncNonce, shouldResetNonce, waitForTx } from './utils';

type ReturnTypeStrict<T> = T extends (...args: any) => any ? ReturnType<T> : never;

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
  const queue = createPriorityQueue<{
    execute: (
      txOverrides: Overrides
    ) => Promise<{ hash: string; wait: () => Promise<TransactionReceipt> }>;
    estimateGas: () => Promise<BigNumberish>;
    cancel: (error: any) => void;
    stateMutability?: string;
  }>();
  const submissionMutex = new Mutex();
  const _nonce = observable.box<number | null>(null);

  const readyState = computed(() => {
    const connected = network.connected.get();
    const contracts = computedContracts.get();
    const signer = network.signer.get();
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
    const newNonce = (await network.signer.get()?.getTransactionCount()) ?? null;
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

  // queue up a transaction call in the txQueue
  async function queueCall(
    txRequest: TransactionRequest,
    callOverrides?: CallOverrides
  ): Promise<{
    hash: string;
    wait: () => Promise<TransactionReceipt>;
    response: Promise<any>;
  }> {
    const [resolve, reject, promise] = deferred<{
      hash: string;
      wait: () => Promise<TransactionReceipt>;
      response: Promise<any>;
    }>();

    const { signer } = await awaitValue(readyState); // wait for network if not ready

    // skip gas estimation if gasLimit is set
    const estimateGas = () =>
      callOverrides?.gasLimit
        ? Promise.resolve(callOverrides.gasLimit)
        : signer!.estimateGas(txRequest);

    // Create a function that executes the tx when called
    const execute = async (txOverrides: Overrides) => {
      try {
        // Populate config and Tx
        const populatedTx = { ...txRequest, ...txOverrides, ...callOverrides };
        const tx = await sendTx(signer, populatedTx!);
        const hash = tx?.hash || '';

        const response = signer.provider!.getTransaction(hash); // todo: do we need to return response?

        // This promise is awaited asynchronously in the tx queue and the action queue to catch errors
        const wait = async () => waitForTx(response);

        // Resolved value goes to the initiator of the transaction
        resolve({ hash, wait, response });

        // Returned value gets processed inside the tx queue
        return { hash, wait };
      } catch (e) {
        reject(e as Error);
        throw e; // Rethrow error to catch when processing the queue
      }
    };

    // Queue the tx execution
    queue.add(uuid(), {
      execute,
      cancel: (error?: any) => reject(error ?? new Error('TX_CANCELLED')),
      estimateGas,
      stateMutability: '',
    });

    processQueue(); // Start processing the queue
    return promise; // Promise resolves when the tx is confirmed or rejected
  }

  // queue up a system call in the txQueue
  async function queueCallSystem(
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
    const callOverrides = (hasOverrides ? args[args.length - 1] : {}) as CallOverrides;
    const argsWithoutOverrides = hasOverrides ? args.slice(0, args.length - 1) : args;

    const populatedTx = await target.populateTransaction[prop as string](...argsWithoutOverrides);
    return queueCall(populatedTx, callOverrides);
  }

  async function processQueue() {
    const txRequest = queue.next();
    if (!txRequest) return;
    processQueue(); // Start processing another request from the queue

    // Run exclusive to avoid two tx requests awaiting the nonce in parallel and submitting with the same nonce.
    const txResult = await submissionMutex.runExclusive(async () => {
      // First estimate gas to avoid increasing nonce before tx is sent
      let txOverrides: Overrides = {};
      try {
        const { nonce } = await awaitValue(readyState); // wait for network if not ready
        txOverrides.gasLimit = await txRequest.estimateGas();
        txOverrides.nonce = nonce;
      } catch (e) {
        console.warn('[TXQueue] GAS ESTIMATION FAILED');
        return txRequest.cancel(e);
      }

      // Execute the tx
      let error: any;
      try {
        return await txRequest.execute(txOverrides);
      } catch (e) {
        console.warn('[TXQueue] EXECUTION FAILED');
        error = e;
      } finally {
        // console.log(`[TXQueue] TX Sent\n`, `Error: ${!!error}\n`);
        if (shouldIncNonce(error)) incNonce();
        else if (shouldResetNonce(error)) await resetNonce();
        if (error) txRequest.cancel(error);
      }
    });

    // Await confirmation
    if (txResult?.hash) {
      try {
        const tx = await txResult.wait();
        console.log(`[TXQueue] TX Confirmed\n`, tx);
      } catch (e) {
        console.warn('[TXQueue] tx failed in block');
        throw e; // bubble up error
        // // Decode and log the revert reason.
        // getRevertReason(txResult.hash, network.providers.get().json).then((reason) =>
        //   console.warn('[TXQueue] Revert reason:', reason)
        // ); // calling then instead of await to avoid blocking
      }
    }

    processQueue();
  }

  // wraps contract call with txQueue
  function proxyContract<Contract extends C[keyof C]>(contract: Contract): Contract {
    return mapObject(contract as any, (value, key) => {
      // Relay all base contract methods to the original target
      if (key in BaseContract.prototype) return value;

      // Relay everything that is not a function call to the original target
      if (!(value instanceof Function)) return value;

      // Channel all contract specific methods through the queue
      return (...args: unknown[]) => queueCallSystem(contract, key as keyof BaseContract, args);
    }) as Contract;
  }

  const proxiedContracts = computed(() => {
    const contracts = readyState.get()?.contracts;
    return contracts ? mapObject(contracts, proxyContract) : undefined;
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
