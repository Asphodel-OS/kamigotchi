// src/layers/react/engine/Engine.tsx:
import { RainbowKitProvider, getDefaultWallets, lightTheme } from '@rainbow-me/rainbowkit';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import { defaultChain } from 'constants/chains';
import { Layers } from 'src/types';
import { BootScreen, MainWindow } from './components';
import { EngineContext, LayerContext } from './context';
import { EngineStore } from './store';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [defaultChain],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Kamigotchi',
  projectId: 'YOUR_PROJECT_ID',
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

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
    console.log(`LOADING (chain ${defaultChain.id})`);
  }, []);

  if (!mounted || !layers) return <BootScreen />;
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        theme={lightTheme({
          accentColor: '#ffffff',
          accentColorForeground: '#000000',
          fontStack: 'system',
        })}
        chains={chains}
        initialChain={defaultChain} // technically this is unnecessary, defaults to 1st chain
      >
        <LayerContext.Provider value={layers}>
          <EngineContext.Provider value={EngineStore}>
            <MainWindow />
          </EngineContext.Provider>
        </LayerContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
});
