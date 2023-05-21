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

  // mount root and layers used for app context
  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
  }, []);

  // update the network settings whenever the connector/address changes
  useEffect(() => {
    updateNetworkSettings(connector);
  }, [connector, connectorAddress]);

  // add a network layer if one for the connection doesnt exist
  const updateNetworkSettings = async (connector: Connector | undefined) => {
    console.log("CHECKING TO SWAP CONNECTOR");

    if (connector && connectorAddress) {
      // check if address already saved
      const hotAddress = connectorAddress.toLowerCase();
      if (!networkSettings.networks.has(hotAddress)) {

        // create newtork config
        const provider = await connector.getProvider()
        const networkConfig = createNetworkConfig(provider);
        if (!networkConfig) throw new Error('Invalid config');

        // create network layer
        const networkLayer = await createNetworkLayer(networkConfig);
        networkLayer.startSync();

        // update the network settings
        let updatedNetworks = networkSettings.networks.set(hotAddress, networkLayer);
        setNetworkSettings({
          connectedAddress: hotAddress,
          networks: updatedNetworks,
        });
        console.log(networkSettings);
      }
    }
  };

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
