import React, { useEffect, useState } from 'react';
import { map, merge, of } from 'rxjs';
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
export function registerOperatorUpdater() {
  registerUIComponent(
    'OperatorUpdater',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 30,
      rowEnd: 60,
    },
    (layers) => of(layers),
    (layers) => {
      const { isConnected } = useAccount();
      const { details: accountDetails } = useKamiAccount();
      const { burnerInfo, selectedAddress, networks } = useNetworkSettings();
      const { sound: { volume } } = dataStore();
      const [isVisible, setIsVisible] = useState(false);

      const {
        network: {
          actions,
        },
      } = layers;

      // toggle visibility based on many things
      useEffect(() => {
        const burnersMatch = burnerInfo.connected === burnerInfo.detected;
        const hasAccount = !!accountDetails.id;
        const operatorMatch = accountDetails.operatorAddress === burnerInfo.connected;
        setIsVisible(isConnected && burnersMatch && hasAccount && !operatorMatch);
      }, [isConnected, burnerInfo, accountDetails]);

      /////////////////
      // ACTIONS

      const playSound = (sound: any) => {
        const soundFx = new Audio(sound);
        soundFx.volume = volume;
        soundFx.play();
      }

      const setOperatorWithFx = async (address: string) => {
        playSound(scribbleSound);
        await setOperator(address);
        playSound(successSound);
      }

      const setOperator = async (address: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;

        console.log('SETTING OPERATOR:', address);
        const actionID = `Setting Operator` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.set.operator(burnerInfo.connected);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions.Action, actionIndex);
      }

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper id='operator-updater' style={{ display: isVisible ? 'block' : 'none' }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Update Your Operator</Title>
            <Description>(Connected Burner does not match Account Operator for {accountDetails.name})</Description>
            <br />
            <Description>Account Operator: {accountDetails.operatorAddress}</Description>
            <Description>Connected Burner: {burnerInfo.connected}</Description>
            <SingleInputTextForm
              id={`new-operator`}
              label='new address'
              placeholder='new operator address'
              hasButton={true}
              onSubmit={(v: string) => setOperatorWithFx(v)}
              initialValue={burnerInfo.connected}
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
