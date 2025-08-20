import { getComponentValue } from '@mud-classic/recs';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { BootScreen, LoadingState as LoadingStateComponent } from 'app/components/boot';
import { privyConfig, tanstackClient, wagmiConfig } from 'clients/';
import { GodID, SyncState, SyncStatus } from 'engine/constants';
import { Layers } from 'network/';
import { MainWindow } from './components/MainWindow';
import { NetworkContext } from './context';

export const Root = observer(
  ({
    setLayers,
    mountReact,
  }: {
    setLayers: { current: (layers: Layers) => void };
    mountReact: { current: (mount: boolean) => void };
  }) => {
    const [mounted, setMounted] = useState(true);
    const [layers, _setLayers] = useState<Layers | undefined>();
    const [ready, setReady] = useState(false);
    const [loadingState, setLoadingState] = useState<SyncStatus | undefined>();

    // mount root and layers used for app context
    useEffect(() => {
      mountReact.current = (mounted: boolean) => setMounted(mounted);
      setLayers.current = (layers: Layers) => _setLayers(layers);
      localStorage.removeItem('wagmi.store');
    }, []);

    // show boot screen until network is loaded
    useEffect(() => {
      if (!layers) return;
      const {
        components: { LoadingState },
        world,
      } = layers.network;
      const liveStateWatcher = LoadingState.update$.subscribe(() => {
        const GodEntityIndex = world.entityToIndex.get(GodID);
        const loadingState =
          GodEntityIndex != null ? getComponentValue(LoadingState, GodEntityIndex) : undefined;

        if (loadingState?.state === SyncState.LIVE) {
          setReady(true);
        }
      });
      const LoadingStateComponentWatcher = LoadingStateComponent.requirement(layers).subscribe(
        ({ loadingState }) => {
          setLoadingState(loadingState);
        }
      );
      return () => {
        liveStateWatcher.unsubscribe();
        LoadingStateComponentWatcher.unsubscribe();
      };
    }, [layers]);

    const showBootScreen = !mounted || !layers;
    const status = loadingState?.msg || 'Connecting...';
    const percentage = loadingState?.percentage || 0;

    return showBootScreen ? (
      <BootScreen status={status} progress={percentage} />
    ) : (
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        clientId={import.meta.env.VITE_PRIVY_CLIENT_ID}
        config={privyConfig}
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={tanstackClient}>
            <NetworkContext.Provider value={layers}>
              <MainWindow ready={ready} />
            </NetworkContext.Provider>
          </QueryClientProvider>
        </WagmiProvider>
      </PrivyProvider>
    );
  }
);
