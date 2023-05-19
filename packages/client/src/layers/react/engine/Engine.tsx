// src/layers/react/engine/Engine.tsx:
import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { canto } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

import { Layers } from 'src/types';
import { BootScreen, MainWindow } from "./components";
import { EngineContext, LayerContext } from "./context";
import { EngineStore } from "./store";
import { lattice, local } from 'constants/chains';

// TODO: add canto testnet
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    canto,
    lattice,
    local,
    // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [goerli] : []),
  ],
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
  customBootScreen?: React.ReactElement;
}> = observer(({ mountReact, setLayers, customBootScreen }) => {
  const [mounted, setMounted] = useState(true);
  const [layers, _setLayers] = useState<Layers | undefined>();

  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
  }, []);
  // we may want to use useEffect on the BootScreen's return value here
  // and register data-subscribed UI components according to that listened state

  if (!mounted || !layers) return customBootScreen || <BootScreen />;

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <LayerContext.Provider value={layers}>
          <EngineContext.Provider value={EngineStore}>
            <MainWindow />
          </EngineContext.Provider>
        </LayerContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
});
