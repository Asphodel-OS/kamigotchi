// src/layers/react/engine/Engine.tsx:
import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, useAccount, Connector, WagmiConfig } from 'wagmi';
import { canto } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';


import { Layers } from 'src/types';
import { BootScreen, MainWindow } from "./components";
import { EngineContext, LayerContext } from "./context";
import { EngineStore } from "./store";
import { lattice, local } from 'constants/chains';
import { createNetworkConfig } from 'layers/network/config';
import { createNetworkLayer } from 'layers/network/createNetworkLayer';
import { dataStore } from 'layers/react/store/createStore';

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
  const { networkSettings, setNetworkSettings } = dataStore();
  const { connector, address: connectorAddress } = useAccount();

  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
  }, []);
  // we may want to use useEffect on the BootScreen's return value here
  // and register data-subscribed UI components according to that listened state

  useEffect(() => {

    const swapConnector = async (connector: Connector | undefined) => {
      console.log("CHECKING TO SWAP CONNECTOR");
      // create the new network config
      let networkConfig;
      if (connector && connectorAddress) {
        let cAddr = connectorAddress.toLowerCase();
        if (!networkSettings.networks.has(cAddr)) {
          const provider = await connector.getProvider()
          networkConfig = createNetworkConfig(provider);
          if (!networkConfig) throw new Error('Invalid config');

          // create the network layer 
          const networkLayer = await createNetworkLayer(networkConfig);
          let updatedNetworks = networkSettings.networks.set(cAddr, networkLayer);
          console.log(networkSettings);
          setNetworkSettings({
            connectedAddress: cAddr,
            networks: updatedNetworks,
          });
        }
      }
    };
    swapConnector(connector);

    // console.log('networkSettings', networkSettings);
  }, [connector, connectorAddress]);

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
