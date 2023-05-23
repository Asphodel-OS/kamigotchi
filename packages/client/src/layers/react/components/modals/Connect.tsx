import React, { useEffect } from 'react';
import { map, merge, of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount } from 'wagmi';
import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { dataStore } from 'layers/react/store/createStore';
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

export function registerConnectModal() {
  registerUIComponent(
    'Connect',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 20,
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
          const burnerAddress = connectedAddress.get();
          const { selectedAddress } = dataStore.getState();
          const accountIndexUpdatedByWorld = getAccountIndexFromOwner(selectedAddress);

          return {
            burnerAddress,
            accountIndexUpdatedByWorld,
            getAccountIndexFromOwner,
            getAccountDetails,
          };
        })
      );
    },

    ({
      burnerAddress,
      accountIndexUpdatedByWorld,
      getAccountIndexFromOwner,
      getAccountDetails,
    }) => {
      const { isConnected } = useAccount();
      const { details, setDetails } = useKamiAccount();
      const { selectedAddress } = dataStore();

      // track the account details in store for easy access
      useEffect(() => {
        const accountIndex = getAccountIndexFromOwner(selectedAddress);
        const accountDetails = getAccountDetails(accountIndex);
        setDetails(accountDetails);
      }, [selectedAddress, isConnected, accountIndexUpdatedByWorld]);

      // how to render the modal
      const modalDisplay = () => (
        (isConnected) ? 'none' : 'block'
      );

      return (
        <ModalWrapper id='connect' style={{ display: modalDisplay() }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Connect a Wallet</Title>
            <Description>{(isConnected) ? '(Connected)' : '(Disconnected)'} </Description>
            <br />
            <Description>Account ID: {details.id}</Description>
            <br />
            <Description>Connector Address: {selectedAddress}</Description>
            <br />
            <Description>Burner Address: {burnerAddress}</Description>
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
