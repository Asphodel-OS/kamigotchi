// src/layers/react/engine/Engine.tsx:
import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { getDefaultWallets, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, useAccount, Connector, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import { BootScreen, MainWindow } from "./components";
import { EngineContext, LayerContext } from "./context";
import { EngineStore } from "./store";
import { defaultChainConfig } from 'constants/chains';
import { createNetworkConfig } from 'layers/network/config';
import { createNetworkLayer } from 'layers/network/createNetworkLayer';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { Layers } from 'src/types';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [defaultChainConfig],
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
  const { networks, setSelectedAddress, addNetwork } = useNetworkSettings();
  const [mounted, setMounted] = useState(true);
  const [layers, _setLayers] = useState<Layers | undefined>();

  // mount root and layers used for app context
  useEffect(() => {
    mountReact.current = (mounted: boolean) => setMounted(mounted);
    setLayers.current = (layers: Layers) => _setLayers(layers);
    console.log(`LOADED IN ${process.env.MODE ?? "DEV"} MODE`);
    console.log(`Expected Chain ID: ${defaultChainConfig.id}`);
  }, []);

  // update the network settings whenever the connector/address changes
  // TODO?: move this logic to the WalletConnector based on updates to the selectedAddress
  useEffect(() => {
    console.log("NETWORK CHANGE DETECTED");
    updateNetworkSettings(connector);
  }, [connector, connectorAddress]);

  // add a network layer if one for the connection doesnt exist
  const updateNetworkSettings = async (connector: Connector | undefined) => {
    if (connectorAddress && connector) {
      const connectedChainID = await connector.getChainId();
      const expectedChainID = defaultChainConfig.id;
      if (connectedChainID !== expectedChainID) return;

      // set the selected network
      const hotAddress = connectorAddress.toLowerCase();
      setSelectedAddress(hotAddress);

      // spawn network client for address if one does not exist
      if (!networks.has(hotAddress)) {
        console.log(`CREATING NETWORK FOR NEW ADDRESS..`, hotAddress);

        // create network config and the new network layer
        const provider = await connector.getProvider()
        const networkConfig = createNetworkConfig(provider);
        if (!networkConfig) throw new Error('Invalid config');
        const networkLayer = await createNetworkLayer(networkConfig);
        networkLayer.startSync();
        addNetwork(hotAddress, networkLayer);
      }
    }
  };

  if (!mounted || !layers) return customBootScreen || <BootScreen />;
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider theme={lightTheme({
        accentColor: '#ffffff',
        accentColorForeground: '#000000',
        fontStack: 'system'
      })} chains={chains}>
        <LayerContext.Provider value={layers}>
          <EngineContext.Provider value={EngineStore}>
            <MainWindow />
          </EngineContext.Provider>
        </LayerContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
});
