import { computedToStream } from '@mud-classic/utils';
import { Signer, Wallet } from 'ethers';
import { computed, observable, toJS } from 'mobx';
import { EMPTY, combineLatest, concatMap, filter, map, throttleTime } from 'rxjs';

import { Providers, createReconnectingProvider } from '../providers';
import { NetworkConfig } from '../types';
import { fetchBlock } from '../utils';
import { createClock } from './clock';
import { createBlockNumberStream } from './utils';

export type Network = Awaited<ReturnType<typeof createNetwork>>;

/**
 * Set up network.
 *
 * @param initialConfig Initial config (see {@link NetworkConfig}).
 * @returns Network object
 */
export async function createNetwork(initialConfig: NetworkConfig) {
  const disposers: (() => void)[] = [];

  const config = observable(initialConfig);
  const {
    providers,
    connected,
    dispose: disposeProvider,
  } = await createReconnectingProvider(computed(() => toJS(config.provider)));
  disposers.push(disposeProvider);

  // create signer
  const signer = await getSigner(config, providers.get());

  // Get address
  const initialConnectedAddress = config.provider.externalProvider
    ? await signer?.getAddress()
    : undefined;

  const connectedAddress = computed(() =>
    config.privateKey
      ? new Wallet(config.privateKey).address.toLowerCase()
      : initialConnectedAddress?.toLowerCase()
  );

  const connectedAddressChecksummed = computed(() =>
    config.privateKey ? new Wallet(config.privateKey).address : initialConnectedAddress
  );

  // Listen to new block numbers
  const { blockNumber$, dispose: disposeBlockNumberStream } = createBlockNumberStream(providers);
  disposers.push(disposeBlockNumberStream);

  // Create local clock subscription
  const clock = createClock(config.clock);
  disposers.push(clock.dispose);

  // Sync the local time to the chain time in regular intervals
  const combinedObservable = combineLatest([blockNumber$, computedToStream(providers)]);
  const blockFetcher = concatMap(([blockNumber, currentProviders]) =>
    currentProviders ? fetchBlock(currentProviders.json, blockNumber) : EMPTY
  );
  const syncBlockSub = combinedObservable
    .pipe(
      throttleTime(config.clock.syncInterval, undefined, { leading: true, trailing: true }), // ignore if clock already defined
      blockFetcher, // Fetch the latest block if a provider is available
      map((block) => block.timestamp * 1000), // Map to timestamp in ms
      filter((blockTimestamp) => blockTimestamp !== clock.lastUpdateTime), // Ignore if the clock was already refreshed with this block
      filter((blockTimestamp) => blockTimestamp !== clock.currentTime) // Ignore if the current local timestamp is correct
    )
    .subscribe(clock.update); // Update the local clock
  disposers.push(() => syncBlockSub?.unsubscribe());

  // todo: stop using computed because we create a new network layer for each wallet?
  return {
    providers,
    signer,
    connected,
    blockNumber$,
    dispose: () => {
      for (const disposer of disposers) disposer();
    },
    clock,
    config,
    connectedAddress,
    connectedAddressChecksummed,
  };
}

async function getSigner(
  config: NetworkConfig,
  currentProviders: Providers
): Promise<Signer | undefined> {
  if (config.provider.externalProvider) return currentProviders.json.getSigner();
  const privateKey = config.privateKey;
  if (privateKey && currentProviders) return new Wallet(privateKey, currentProviders.json);
  return undefined;
}
