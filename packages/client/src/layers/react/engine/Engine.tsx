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
    local,
    lattice,
    canto,
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
  const { connector, address: connectorAddress } = useAccount();
  const { networks, setSelectedAddress } = dataStore();
  const [mounted, setMounted] = useState(true);
  const [layers, _setLayers] = useState<Layers | undefined>();

  // mount root and layers used for app context
  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
  }, []);

  // update the network settings whenever the connector/address changes
  useEffect(() => {
    console.log("NETWORK CHANGE DETECTED");
    updateNetworkSettings(connector);
  }, [connector, connectorAddress]);

  // add a network layer if one for the connection doesnt exist
  const updateNetworkSettings = async (connector: Connector | undefined) => {
    if (connectorAddress && connector) {
      const chainID = await connector.getChainId();
      if (chainID !== 31337) return; // this should be the canto chain id

      // console.log("CONNECTOR", connector);
      // console.log("CONNECTOR ADDRESS", connectorAddress);
      // console.log("CHAIN ID", chainID);

      // spawn network client for address if one does not exist
      const hotAddress = connectorAddress.toLowerCase();
      setSelectedAddress(hotAddress);
      if (!networks.has(hotAddress)) {
        console.log(`CREATING NETWORK FOR NEW ADDRESS..`, hotAddress);

        // create network config and the new network layer
        const provider = await connector.getProvider()
        const networkConfig = createNetworkConfig(provider);
        if (!networkConfig) throw new Error('Invalid config');
        const networkLayer = await createNetworkLayer(networkConfig);
        networkLayer.startSync();

        // update the network settings
        networks.set(hotAddress, networkLayer);
      }
      // console.log("selectedAddress", hotAddress);
      // console.log("connectedNetworks", networks);
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
