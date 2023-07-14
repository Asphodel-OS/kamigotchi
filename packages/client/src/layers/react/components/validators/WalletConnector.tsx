import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount, useNetwork, Connector } from 'wagmi';
import {
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { defaultChainConfig } from 'constants/chains';
import { createNetworkConfig } from 'layers/network/config';
import { createNetworkLayer } from 'layers/network/createNetworkLayer';
import { dataStore } from 'layers/react/store/createStore';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { registerUIComponent } from 'layers/react/engine/store';
import {
  AccountDetails,
  emptyAccountDetails,
  useKamiAccount,
} from 'layers/react/store/kamiAccount';
import 'layers/react/styles/font.css';


/** 
 * The sole purpose of this here monstrosity is to keep track of the connected Kami Account
 * based on the connected wallet address. Unfortunately, this means listening to both changes
 * in the Connector's address through State hooks, as well as to subscribed world components
 * on the Requirement step that may result in the creation of an account in-world.
 * 
 * The requirement step determines the Account's EntityIndex using a mirrored address saved on the
 * zustand store as wagmi's useAccount() is unavailable outside of React components. It is also
 * necessary to properly update the modal whenever the page is refreshed, causing a repopulation of
 * the world client-side.
 * 
 * The modal component then takes this index as a prop and simply listens to it. Nothing more. It
 * instead relies on a hook to the Same zustand store item for the Same connected account because
 * it's possible either side may be stale.
 * 
 * Let's not fool ourselves into thinking this is an elegant solution by any measure. It is an
 * abomination birthed out of necessity and should be treated as such.
 */

export function registerWalletConnecter() {
  registerUIComponent(
    'WalletConnecter',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 40,
      rowEnd: 60,
    },
    (layers) => {
      const {
        network: {
          components: {
            IsAccount,
            Name,
            OperatorAddress,
            OwnerAddress,
          },
          network: { connectedAddress },
          world,
        },
      } = layers;

      const getAccountDetails = (index: EntityIndex): AccountDetails => {
        if (!index) return emptyAccountDetails();
        return {
          id: world.entities[index],
          index: index,
          ownerAddress: getComponentValue(OwnerAddress, index)?.value as string,
          operatorAddress: getComponentValue(OperatorAddress, index)?.value as string,
          name: getComponentValue(Name, index)?.value as string,
        };
      }

      const getAccountIndexFromOwner = (ownerAddress: string): EntityIndex => {
        const accountIndex = Array.from(
          runQuery([
            Has(IsAccount),
            HasValue(OwnerAddress, {
              value: ownerAddress,
            }),
          ])
        )[0];
        return accountIndex;
      };

      return merge(
        IsAccount.update$,
        Name.update$,
        OperatorAddress.update$,
        OwnerAddress.update$,
      ).pipe(
        map(() => {
          const { selectedAddress } = useNetworkSettings.getState();
          const accountIndexUpdatedByWorld = getAccountIndexFromOwner(selectedAddress);
          const accountDetailsFromWorld = getAccountDetails(accountIndexUpdatedByWorld);
          return {
            accountDetailsFromWorld,
            getAccountIndexFromOwner,
            getAccountDetails,
          };
        })
      );
    },
    ({
      accountDetailsFromWorld,
      getAccountIndexFromOwner,
      getAccountDetails,
    }) => {
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
        selectedAddress,
        setSelectedAddress,
      } = useNetworkSettings();

      const { setDetails } = useKamiAccount();
      const { toggleVisibleButtons, toggleVisibleModals } = dataStore();
      const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
      const [title, setTitle] = useState('Connect a Wallet');
      const [description, setDescription] = useState('');

      // check whether the correctNetwork is connected
      useEffect(() => {
        setIsCorrectNetwork(chain?.id === defaultChainConfig.id);
      }, [isConnected, chain]);

      // title and description as needed
      useEffect(() => {
        if (!isCorrectNetwork) {
          setTitle('Wrong Network');
          setDescription(`Please connect to ${defaultChainConfig.name}`);
        } else {
          setTitle('Connect a Wallet');
          setDescription('You must connect a wallet to continue.');
        }
      }, [isCorrectNetwork]);

      // track the account details in store for easy access
      // expose/hide components accordingly
      useEffect(() => {
        const accountIndex = getAccountIndexFromOwner(selectedAddress);
        const accountDetails = getAccountDetails(accountIndex);
        setDetails(accountDetails);

        if (accountDetails.id) {
          toggleVisibleButtons(true);
        } else {
          toggleVisibleButtons(false);
          toggleVisibleModals(false);
        }
      }, [selectedAddress, isConnected, accountDetailsFromWorld]);

      // update the network settings whenever the connector/address changes
      useEffect(() => {
        console.log("WALLET IS", status);
        console.log("NETWORK CHANGE DETECTED");
        updateNetworkSettings(connector);
      }, [chain, connector, connectorAddress, isConnected]);

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
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  padding: 10px 0px 15px 0px;
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
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;
