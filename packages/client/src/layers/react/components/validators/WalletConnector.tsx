import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount, useNetwork, Connector } from 'wagmi';

import { ChainButton } from 'layers/react/components/library/CustomRainbowButton';

import { defaultChainConfig } from 'constants/chains';
import { createNetworkConfig } from 'layers/network/config';
import { createNetworkLayer } from 'layers/network/createNetworkLayer';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

// Detects network changes and populates network clients for inidividual addresses.
// The purpose of this modal is to warn the user when something is amiss.
export function registerWalletConnecter() {
  registerUIComponent(
    'WalletConnecter',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 40,
      rowEnd: 60,
    },
    (layers) => of(layers),
    (layers) => {
      const { chain } = useNetwork();

      const {
        address: connectorAddress,
        connector,
        isConnected,
        status
      } = useAccount();

      const {
        networks,
        addNetwork,
        setSelectedAddress,
      } = useNetworkSettings();

      const {
        network: {
          updates: {
            functions: { UpdateNetwork },
          }
        }
      } = layers;

      const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
      const [title, setTitle] = useState('Connect a Wallet');
      const [description, setDescription] = useState('');

      // check whether the correctNetwork is connected
      // update title and description as needed
      useEffect(() => {
        const networksMatch = chain?.id === defaultChainConfig.id;
        setIsCorrectNetwork(networksMatch);
        if (!isConnected) {
          setTitle('Connect a Wallet');
          setDescription('You must connect a wallet to continue.');
        } else if (!networksMatch) {
          setTitle('Wrong Network');
          setDescription(`Please connect to ${defaultChainConfig.name}`);
        } else {
          UpdateNetwork();
        }
      }, [isConnected, chain]);

      // update the network settings whenever the connector/address changes
      useEffect(() => {
        console.log(`NETWORK CHANGE DETECTED (wallet ${status})`);
        updateNetworkSettings(connector);
      }, [chain, connector, connectorAddress, isConnected, isCorrectNetwork]);


      /////////////////
      // ACTIONS

      // add a network layer if one for the connection doesnt exist
      const updateNetworkSettings = async (connector: Connector | undefined) => {
        // if disconnected or not connected to the default chain, wipe
        if (!isConnected || !isCorrectNetwork) {
          setSelectedAddress('');
          return;
        }

        if (!connectorAddress || !connector) return;

        // set the selected address and spawn network client for address as needed
        const connectorAddressLowerCase = connectorAddress.toLowerCase();
        setSelectedAddress(connectorAddressLowerCase);
        if (!networks.has(connectorAddressLowerCase)) {
          console.log(`CREATING NETWORK FOR..`, connectorAddressLowerCase);

          // create network config and the new network layer
          const provider = await connector.getProvider()
          const networkConfig = createNetworkConfig(provider);
          if (!networkConfig) throw new Error('Invalid config');
          const networkLayer = await createNetworkLayer(networkConfig);
          networkLayer.startSync();
          addNetwork(connectorAddressLowerCase, networkLayer);
        }
      };

      /////////////////
      // DISPLAY

      const BottomButton = () => {
        if (!isCorrectNetwork && isConnected) {
          return (
            <ChainButton size="medium" />
          );
        }
      };

      /////////////////
      // RENDER

      // how to render the modal
      const modalDisplay = () => (
        (isConnected && isCorrectNetwork) ? 'none' : 'block'
      );

      return (
        <ModalWrapper id='connect' style={{ display: modalDisplay() }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>{title}</Title>
            <Description>({status})</Description>
            <Description>{description}</Description>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {BottomButton()}
            </div>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 10px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  padding: 0px 0px 20px 0px;
  font-family: Pixel;
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const ModalContent = styled.div`
  display: grid;
  justify-content: center;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const ModalWrapper = styled.div`
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;
