import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defaultChain } from 'constants/chains';
import { Layers } from 'src/types';
import { BootScreen, MainWindow } from './components';
import { EngineContext, LayerContext } from './context';
import { EngineStore } from './store';

export const Engine: React.FC<{
  setLayers: { current: (layers: Layers) => void };
  mountReact: { current: (mount: boolean) => void };
}> = observer(({ mountReact, setLayers }) => {
  const [mounted, setMounted] = useState(true);
  const [layers, _setLayers] = useState<Layers | undefined>();

  // mount root and layers used for app context
  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
    console.log(`LOADED IN '${import.meta.env.MODE}' MODE (chain ${defaultChain.id})`);
  }, []);

  const queryClient = new QueryClient();

  const wagmiConfig = createConfig({
    chains: [defaultChain],
    transports: {
      [defaultChain.id]: http(),
    },
  });

  const privyConfig: PrivyClientConfig = {
    // Customize Privy's appearance in your app
    appearance: {
      theme: 'light',
      accentColor: '#676FFF',
      logo: 'https://imgur.com/lYdPt9I',
      showWalletLoginFirst: true,
    },
    defaultChain: defaultChain,
    supportedChains: [defaultChain],
    // Create embedded wallets for users who don't have a wallet
    embeddedWallets: {
      createOnLogin: 'all-users',
    },
  };

  if (!mounted || !layers) return <BootScreen />;
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider appId='cltxr4rvw082u129anv6cq7wr' config={privyConfig}>
          <LayerContext.Provider value={layers}>
            <EngineContext.Provider value={EngineStore}>
              <MainWindow />
            </EngineContext.Provider>
          </LayerContext.Provider>
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
});
