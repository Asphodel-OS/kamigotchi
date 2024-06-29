import { TransactionReceipt } from '@ethersproject/providers';
import { awaitValue, cacheUntilReady, deferred, mapObject, uuid } from '@mud-classic/utils';
import { Mutex } from 'async-mutex';
import { BaseContract, BigNumberish, CallOverrides, Overrides } from 'ethers';
import { IComputedValue, IObservableValue, autorun, computed, observable, runInAction } from 'mobx';

import { Network } from 'engine/executors';
import { ConnectionState } from 'engine/providers';
import { Contracts } from 'engine/types';
import { createPriorityQueue } from './priorityQueue';
import { TxQueue } from './types';
import { getRevertReason, getTxGasData, isOverrides } from './utils';

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
): { txQueue: TxQueue<C>; dispose: () => void; ready: IComputedValue<boolean | undefined> } {
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

  let utilization = 0;

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
  function queueCall(
    target: C[keyof C],
    prop: keyof C[keyof C],
    args: unknown[]
  ): Promise<{
    hash: string;
    wait: () => Promise<TransactionReceipt>;
    response: Promise<ReturnTypeStrict<(typeof target)[typeof prop]>>;
  }> {
    const [resolve, reject, promise] = deferred<{
      hash: string;
      wait: () => Promise<TransactionReceipt>;
      response: Promise<ReturnTypeStrict<(typeof target)[typeof prop]>>;
    }>();

    // Extract existing overrides from function call
    const hasOverrides = args.length > 0 && isOverrides(args[args.length - 1]);
    const callOverrides = (hasOverrides ? args[args.length - 1] : {}) as CallOverrides;
    const argsWithoutOverrides = hasOverrides ? args.slice(0, args.length - 1) : args;

    // Store state mutability to know when to increase the nonce
    const fragment = target.interface.fragments.find((fragment) => fragment.name === prop);
    const stateMutability = fragment && (fragment as { stateMutability?: string }).stateMutability;

    // Create a function that estimates gas
    const estGasFunction = target.estimateGas[prop as string];
    const estimateGas = () => estGasFunction(...args);

    // Create a function that executes the tx when called
    const execute = async (txData: Overrides) => {
      try {
        const member = target.populateTransaction[prop as string];
        if (member == undefined) {
          throw new Error('Member does not exist.');
        }

        if (!(member instanceof Function)) {
          throw new Error(
            `Internal TxQueue error: Member is not a function and should not be proxied. Tried to call "${String(
              prop
            )}".`
          );
        }

        // Populate config and Tx
        const configOverrides = { ...callOverrides, ...txData };
        const populatedTx = await member(...argsWithoutOverrides, configOverrides);
        const tx = await target.signer.sendTransaction(populatedTx);
        const hash = tx.hash;

        const response = target.provider.getTransaction(hash) as Promise<
          ReturnTypeStrict<(typeof target)[typeof prop]>
        >;
        // This promise is awaited asynchronously in the tx queue and the action queue to catch errors
        // const wait = async () => (await response).wait();
        const wait = async () => {
          const txConfirmed = await target.provider.waitForTransaction(hash, 1, 45000);
          if (txConfirmed?.status === 0) {
            // if tx did not complete, initiate tx.wait() to throw regular error
            return (await response).wait();
          }
          return txConfirmed;
        };

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
      stateMutability,
    });

    processQueue(); // Start processing the queue
    return promise; // Promise resolves when the tx is confirmed or rejected
  }

  async function processQueue() {
    const txRequest = queue.next();
    if (!txRequest) return;
    utilization++; // Increase utilization to track capacity
    processQueue(); // Start processing another request from the queue

    // Run exclusive to avoid two tx requests awaiting the nonce in parallel and submitting with the same nonce.
    const txResult = await submissionMutex.runExclusive(async () => {
      // First estimate gas to avoid increasing nonce before tx is sent
      let txOverrides: Overrides;
      try {
        const { provider, nonce } = await awaitValue(readyState); // wait for network if not ready
        txOverrides = await getTxGasData(provider, txRequest.estimateGas);
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
        // If tx was submitted, inc nonce regardless of error
        const isViewTx = txRequest.stateMutability === 'view';
        const isMutationError = !!error?.transaction && !isViewTx; // wtf does this even mean
        const doIncNonce = (!error && !isViewTx) || isMutationError;

        const isExpirationError = error?.code === 'NONCE_EXPIRED';
        const isRepeatError = error?.reason?.includes('transaction already imported');
        const doResetNonce = isExpirationError || isRepeatError;

        console.log(
          `[TXQueue] TX Sent\n`,
          `(error=${!!error},`,
          `isMutationError=${isMutationError},`,
          `incNonce=${!!doIncNonce},`,
          `resetNonce=${!!doResetNonce})`
        );

        // Nonce handling
        if (doIncNonce) incNonce();
        if (doResetNonce) await resetNonce();
        if (error) txRequest.cancel(error);
      }
    });

    // Await confirmation
    if (txResult?.hash) {
      try {
        await txResult.wait();
      } catch (e) {
        console.warn('[TXQueue] tx failed in block', e);

        // Decode and log the revert reason.
        // Use `then` instead of `await` to avoid letting consumers wait.
        getRevertReason(txResult.hash, network.providers.get().json).then((reason) =>
          console.warn('[TXQueue] Revert reason:', reason)
        );
        console.log(`txHash: ${txResult.hash}`);
      }
    }

    utilization--;

    // Check if there are any transactions waiting to be processed
    processQueue();
  }

  // NOTE(jb): no clue what this actually does
  function proxyContract<Contract extends C[keyof C]>(contract: Contract): Contract {
    return mapObject(contract as any, (value, key) => {
      // Relay all base contract methods to the original target
      if (key in BaseContract.prototype) return value;

      // Relay everything that is not a function call to the original target
      if (!(value instanceof Function)) return value;

      // Channel all contract specific methods through the queue
      return (...args: unknown[]) => queueCall(contract, key as keyof BaseContract, args);
    }) as Contract;
  }

  const proxiedContracts = computed(() => {
    const contracts = readyState.get()?.contracts;
    if (!contracts) return undefined;
    return mapObject(contracts, proxyContract);
  });

  const cachedProxiedContracts = cacheUntilReady(proxiedContracts);

  return {
    txQueue: cachedProxiedContracts,
    dispose,
    ready: computed(() => (readyState ? true : undefined)),
  };
}
