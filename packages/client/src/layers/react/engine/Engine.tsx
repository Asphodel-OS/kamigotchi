import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';

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
    console.log(`Loaded in { ${import.meta.env.MODE} } mode (chain ${defaultChain.id}).`);
  }, []);

  /////////////////
  // CONFIGURATION

  const queryClient = new QueryClient();
  const transportUrl = import.meta.env.DEV
    ? ''
    : 'https://go.getblock.io/ecf00857f13140bb9d75d51597663370';

  const wagmiConfig = createConfig({
    chains: [defaultChain],
    transports: {
      [defaultChain.id]: http(transportUrl),
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
      noPromptOnSignature: true,
      waitForTransactionConfirmation: false,
    },
  };

  /////////////////
  // RENDER

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
