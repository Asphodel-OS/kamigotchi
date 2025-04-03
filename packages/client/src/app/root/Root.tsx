import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { BootScreen } from 'app/components/boot';
import { privyConfig, tanstackClient, wagmiConfig } from 'clients/';
import { Layers } from 'network/';
import { MainWindow } from './components';
import { NetworkContext, RootContext } from './context';
import { RootStore } from './store';

interface Props {
  setLayers: { current: (layers: Layers) => void };
  mountReact: { current: (mount: boolean) => void };
}

export const Root = observer((props: Props) => {
  const { setLayers, mountReact } = props;
  const [mounted, setMounted] = useState(true);
  const [layers, _setLayers] = useState<Layers | undefined>();

  // mount root and layers used for app context
  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
    localStorage.removeItem('wagmi.store');
  }, []);

  // show boot screen until network is loaded
  if (!mounted || !layers) return <BootScreen status='' />;
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      clientId={import.meta.env.VITE_PRIVY_CLIENT_ID}
      config={privyConfig}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={tanstackClient}>
          <NetworkContext.Provider value={layers}>
            <RootContext.Provider value={RootStore}>
              <MainWindow />
            </RootContext.Provider>
          </NetworkContext.Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
});
