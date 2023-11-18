import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';

import { defaultChainConfig } from 'constants/chains';
import { createNetworkConfig } from 'layers/network/config';
import { createNetworkLayer } from 'layers/network/createNetworkLayer';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import 'layers/react/styles/font.css';


// Detects network changes and populates network clients for inidividual addresses.
// The purpose of this modal is to warn the user when something is amiss.
export function registerWalletConnecter() {
  registerUIComponent(
    'WalletConnecter',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 35,
      rowEnd: 60,
    },
    (layers) => of(layers),
    (layers) => {
      const { UpdateNetwork } = layers.network.updates.functions;
      const { address: connectorAddress, connector } = useAccount();
      const { isConnected, status } = useAccount();
      const { chain } = useNetwork();
      const { openConnectModal } = useConnectModal();
      const { openChainModal } = useChainModal();

      const { networks, addNetwork, setSelectedAddress } = useNetworkSettings();
      const { toggleButtons, toggleModals, toggleFixtures } = useComponentSettings();
      const { validators, setValidators } = useComponentSettings();

      const [isVisible, setIsVisible] = useState(false);
      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [buttonLabel, setButtonLabel] = useState('');


      // update the network settings whenever the connector/address changes
      // determine whether/with what content this Validator should be populated
      useEffect(() => {
        let isVisible = true;
        console.log(`NETWORK CHANGE DETECTED (wallet ${status})`);

        // populate validator or initialize network depending on network validity
        if (!connector || !isConnected || !connectorAddress) {
          setSelectedAddress('');
          setTitle('Wallet Disconnected');
          setDescription('You must connect a wallet to continue.');
          setButtonLabel('Connect Wallet');
        } else if (chain?.id !== defaultChainConfig.id) {
          setTitle('Wrong Network');
          setDescription(`Please connect to ${defaultChainConfig.name} network.`);
          setButtonLabel('Change Networks');
        } else {
          isVisible = false;
          updateNetworkSettings();
          UpdateNetwork();
        }

        setIsVisible(isVisible);
      }, [chain?.id, connector, connectorAddress, isConnected]);

      // adjust visibility of windows based on above determination
      useEffect(() => {
        if (isVisible) {
          toggleModals(false);
          toggleButtons(false);
          toggleFixtures(false);
        }
        setValidators({ ...validators, walletConnector: isVisible });
      }, [isVisible]);


      /////////////////
      // ACTIONS

      // add a network layer if one for the connection doesnt exist
      const updateNetworkSettings = async () => {
        // set the selected address and spawn network client for address as needed
        const connectorAddressLowerCase = connectorAddress!.toLowerCase();
        setSelectedAddress(connectorAddressLowerCase);
        if (!networks.has(connectorAddressLowerCase)) {
          console.log(`CREATING NETWORK FOR..`, connectorAddressLowerCase);

          // create network config and the new network layer
          const provider = await connector!.getProvider()
          const networkConfig = createNetworkConfig(provider);
          if (!networkConfig) throw new Error('Invalid config');
          const networkLayer = await createNetworkLayer(networkConfig);
          networkLayer.startSync();
          addNetwork(connectorAddressLowerCase, networkLayer);
        }
      };

      const getButtonAction = () => {
        if (!isConnected) {
          return openConnectModal;
        }
        if (chain?.id !== defaultChainConfig.id) {
          return openChainModal;
        }
      }

      /////////////////
      // RENDER

      return (
        <ValidatorWrapper
          id='wallet-connector'
          divName='walletConnector'
          title={title}
        >
          <Description>{description}</Description>
          <ActionButton
            id='connect-button'
            onClick={getButtonAction() ?? (() => { })}
            text={buttonLabel}
            size='vending'
          />
        </ValidatorWrapper>
      );
    }
  );
}

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  padding: 0px 0px 20px 0px;
  font-family: Pixel;
`;