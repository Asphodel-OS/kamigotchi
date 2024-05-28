import { PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

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
  const mode = import.meta.env.MODE;

  // mount root and layers used for app context
  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
    console.log(`Loaded in { ${mode} } mode (chain ${defaultChain.id}).`);
  }, []);

  /////////////////
  // CONFIGURATION

  const queryClient = new QueryClient({
    defaultOptions: {
      // queries: {
      //   staleTime: 1000 * 10,
      //   gcTime: 1000 * 60 * 60 * 24,
      //   retry: 5,
      // },
    },
  });

  const defaultTransport =
    mode === 'development' ? http() : http(import.meta.env.VITE_RPC_TRANSPORT_URL);
  const wagmiConfig = createConfig({
    chains: [defaultChain],
    transports: {
      [defaultChain.id]: defaultTransport,
    },
    connectors: [injected()],
    pollingInterval: 1000, // TODO: set this with a config value
  });

  const privyConfig: PrivyClientConfig = {
    // Customize Privy's appearance in your app
    appearance: {
      theme: 'light',
      accentColor: '#676FFF',
      logo: import.meta.env.VITE_PRIVY_APP_LOGO,
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
    <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID} config={privyConfig}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <LayerContext.Provider value={layers}>
            <EngineContext.Provider value={EngineStore}>
              <MainWindow />
            </EngineContext.Provider>
          </LayerContext.Provider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
});
