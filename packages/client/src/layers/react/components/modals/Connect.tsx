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

import { registerUIComponent } from 'layers/react/engine/store';
import {
  AccountDetails,
  emptyAccountDetails,
  useKamiAccount,
} from 'layers/react/store/kamiAccount';
import 'layers/react/styles/font.css';

export function registerConnectModal() {
  registerUIComponent(
    'Connect',
    {
      colStart: 34,
      colEnd: 68,
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
          world,
        },
      } = layers;

      return merge(
        IsAccount.update$,
        Name.update$,
        OperatorAddress.update$,
        OwnerAddress.update$,
      ).pipe(
        map(() => (layers))
      );
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
          world
        },
      } = layers;
      const burnerAddress = connectedAddress.get();

      const { address: connectorAddress, isConnected } = useAccount();
      const { details, setDetails } = useKamiAccount();
      console.log("Connect: AccountDetails", details);

      // track the account details in store for easy access
      useEffect(() => {
        const accIndex = Array.from(
          runQuery([
            Has(IsAccount),
            HasValue(OwnerAddress, { value: connectorAddress?.toLowerCase() })
          ])
        )[0];

        let accountDetails = emptyAccountDetails();
        if (accIndex && isConnected) {
          accountDetails = getAccountDetails(accIndex);
        }
        setDetails(accountDetails);
      }, [connectorAddress, isConnected])


      // gets the account details 
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

      return (
        <ModalWrapper id='connect'>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Connect a Wallet</Title>
            <Description>{(isConnected) ? '(Connected)' : '(Disconnected)'} </Description>
            <br />
            <Description>Account ID: {details.id}</Description>
            <br />
            <Description>Connector Address: {connectorAddress}</Description>
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
