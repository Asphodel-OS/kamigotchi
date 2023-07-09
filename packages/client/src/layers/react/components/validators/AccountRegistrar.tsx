import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount } from 'wagmi';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { SingleInputTextForm } from 'layers/react/components/library/SingleInputTextForm';

import scribbleSound from 'assets/sound/fx/scribbling.mp3';
import successSound from 'assets/sound/fx/bubble_success.mp3';
import 'layers/react/styles/font.css';

// TODO: check for whether an account with the burner address already exists
export function registerAccountRegistrar() {
  registerUIComponent(
    'AccountRegistrar',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 30,
      rowEnd: 60,
    },
    (layers) => {
      const {
        network: {
          components: { IsAccount, OwnerAddress },
          actions
        },
      } = layers;

      return merge(IsAccount.update$, OwnerAddress.update$).pipe(
        map(() => {
          return {
            network: layers.network.network,
            actions: actions,
          };
        })
      );
    },

    ({ network, actions }) => {
      const { isConnected } = useAccount();
      const { details: accountDetails } = useKamiAccount();
      const { burnerInfo, selectedAddress, networks } = useNetworkSettings();
      const { sound: { volume }, visibleModals, setVisibleModals } = dataStore();
      const [isVisible, setIsVisible] = useState(false);

      // toggle buttons and modals based on whether account is detected
      useEffect(() => {
        const burnersMatch = burnerInfo.connected === burnerInfo.detected;
        setIsVisible(isConnected && burnersMatch && !accountDetails.id);
      }, [accountDetails, burnerInfo, isConnected]);

      /////////////////
      // ACTIONS

      const playSound = (sound: any) => {
        const soundFx = new Audio(sound);
        soundFx.volume = volume;
        soundFx.play();
      }

      const createAccountWithFx = async (username: string) => {
        playSound(scribbleSound);
        await createAccount(username);
        playSound(successSound);
        openFundModal();
      }

      const openFundModal = () => {
        setVisibleModals({
          ...visibleModals,
          operatorFund: true,
        });
      };

      const createAccount = async (username: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;

        console.log('CREATING ACCOUNT FOR:', selectedAddress);
        const actionID = `Creating Account` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.register(burnerInfo.connected, username);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions.Action, actionIndex);
      }



      /////////////////
      // DISPLAY

      return (
        <ModalWrapper id='accountRegistration' style={{ display: isVisible ? 'block' : 'none' }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Register Your Account</Title>
            <Description>(no registered account for connected address)</Description>
            <Header>Detected Addresses</Header>
            <Description>Owner: {selectedAddress}</Description>
            <Description>Operator: {burnerInfo.connected}</Description>
            <SingleInputTextForm
              id={`username`}
              label='username'
              placeholder='username'
              hasButton={true}
              onSubmit={(v: string) => createAccountWithFx(v)}
            />
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
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

const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Header = styled.p`
  font-size: 14px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 15px 0px 5px 0px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;
