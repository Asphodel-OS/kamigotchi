import { callWithRetry, observableToComputed, timeoutAfter } from '@mud-classic/utils';
import { BrowserProvider, JsonRpcProvider, Networkish, WebSocketProvider } from 'ethers';
import { IComputedValue, IObservableValue, observable, reaction, runInAction } from 'mobx';

import { ConnectionState, MUDJsonRpcProvider, ProviderConfig, Providers } from './types';

/**
 * Create a JsonRpcProvider and WebsocketProvider pair
 *
 * @param config Config for the provider pair (see {@link ProviderConfig}).
 * @returns Provider pair: {
 *   json: JsonRpcProvider,
 *   ws: WebSocketProvider
 * }
 */
export function create({
  chainId,
  jsonRpcUrl,
  wsRpcUrl,
  externalProvider,
  options,
}: ProviderConfig) {
  const network: Networkish = {
    chainId,
    name: 'yominet',
  };
  const providers = externalProvider
    ? { json: externalProvider, ws: undefined }
    : {
        json: new MUDJsonRpcProvider(jsonRpcUrl, network),
        ws: wsRpcUrl ? new WebSocketProvider(wsRpcUrl, network) : undefined,
      };

  if (options?.pollingInterval) {
    providers.json.pollingInterval = options.pollingInterval;
  }

  return providers;
}

/**
 * Creates a {@link createProvider provider pair} that automatically updates if the config changes
 * and automatically reconnects if the connection is lost.
 *
 * @param config Mobx computed provider config object (see {@link ProviderConfig}).
 * Automatically updates the returned provider pair if the config changes.
 * @returns Automatically reconnecting {@link createProvider provider pair} that updates if the config changes.
 */
export async function createReconnecting(config: IComputedValue<ProviderConfig>) {
  const connected = observable.box<ConnectionState>(ConnectionState.DISCONNECTED);
  const providers = observable.box<Providers>() as IObservableValue<Providers>;
  const disposers: (() => void)[] = [];

  async function initProviders() {
    // Abort if connection is currently being established
    if (connected.get() === ConnectionState.CONNECTING) return;
    // Invalidate current providers
    runInAction(() => connected.set(ConnectionState.CONNECTING));

    // Remove listeners from stale providers and close open connections
    const prevProviders = providers.get();
    prevProviders?.json.removeAllListeners();
    try {
      prevProviders?.ws?.websocket?.close();
    } catch {
      // Ignore errors when closing websocket that was not in an open state
    }

    const conf = config.get();

    // Create new providers
    await callWithRetry(async () => {
      const newProviders = create(conf);
      // If the connection is not successful, this will throw an error, triggering a retry
      !conf?.options?.skipNetworkCheck &&
        (await ensureNetworkIsUp(newProviders.json, newProviders.ws));
      runInAction(() => {
        providers.set(newProviders);
        connected.set(ConnectionState.CONNECTED);
      });
    });
  }

  // Create new providers if config changes
  disposers.push(
    reaction(
      () => config.get(),
      () => initProviders()
    )
  );

  // Reconnect providers in case of error
  disposers.push(
    reaction(
      () => providers.get(),
      (currentProviders) => {
        const wsAny = currentProviders?.ws?.websocket as any;
        if (!wsAny) return;

        const onError = () => {
          initProviders();
        };
        const onClose = () => {
          if (connected.get() === ConnectionState.CONNECTED) {
            console.debug('Reconnecting websocket');
            initProviders();
          }
        };

        if (typeof wsAny.addEventListener === 'function') {
          // Browser WebSocket
          wsAny.addEventListener('error', onError, { once: true });
          wsAny.addEventListener('close', onClose, { once: true });
        } else if (typeof wsAny.once === 'function') {
          // Node "ws" best-effort
          wsAny.once('error', onError);
          wsAny.once('close', onClose);
        } else if (typeof wsAny.on === 'function') {
          // Fallback additive
          wsAny.on('error', onError);
          wsAny.on('close', onClose);
        } else {
          // Last resort: property assignment
          wsAny.onerror = onError;
          wsAny.onclose = onClose;
        }
      }
    )
  );

  // Keep websocket connection alive
  const keepAliveInterval = setInterval(async () => {
    if (connected.get() !== ConnectionState.CONNECTED) return;
    const currentProviders = providers.get();
    if (!currentProviders?.ws) return;
    try {
      await timeoutAfter(currentProviders.ws.getBlockNumber(), 10000, 'Network Request Timed out');
    } catch {
      initProviders();
    }
  }, 10000);
  disposers.push(() => clearInterval(keepAliveInterval));

  await initProviders();

  return {
    connected: observableToComputed(connected),
    providers: observableToComputed(providers),
    dispose: () => {
      for (const disposer of disposers) disposer();
      try {
        providers.get()?.ws?.websocket?.close();
      } catch {
        // Ignore error if websocket is not on OPEN state
      }
    },
  };
}

/**
 * Await network to be reachable.
 *
 * @param provider ethers JsonRpcProvider
 * @param wssProvider ethers WebSocketProvider
 * @returns Promise resolving once the network is reachable
 */
export async function ensureNetworkIsUp(
  provider: JsonRpcProvider | BrowserProvider,
  wssProvider?: WebSocketProvider
): Promise<void> {
  const networkInfoPromise = () => {
    return Promise.all([
      provider.getBlockNumber(),
      wssProvider ? wssProvider.getBlockNumber() : Promise.resolve(),
    ]);
  };
  await callWithRetry(networkInfoPromise, [], 10, 1000);
  return;
}
