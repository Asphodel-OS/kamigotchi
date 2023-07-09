import React, { useEffect, useState, useCallback } from 'react';
import { map, merge, of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount } from 'wagmi';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { useKamiAccount } from 'layers/react/store/kamiAccount';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';

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
      rowStart: 22,
      rowEnd: 73,
    },
    (layers) => of(layers),
    (layers) => {
      const { isConnected } = useAccount();
      const { details: accountDetails } = useKamiAccount();
      const { burnerInfo, selectedAddress, networks } = useNetworkSettings();
      const { sound: { volume }, visibleModals, setVisibleModals } = dataStore();

      const {
        network: {
          actions,
        },
      } = layers;

      const [helperText, setHelperText] = useState("");
      const [newAddress, setNewAddress] = useState("");
      const [newPrivKey, setNewPrivKey] = useState("");

      // toggle visibility based on many things
      useEffect(() => {
        if (!visibleModals.operatorUpdater) {
          const burnersMatch = burnerInfo.connected === burnerInfo.detected;
          const hasAccount = !!accountDetails.id;
          const operatorMatch = accountDetails.operatorAddress === burnerInfo.connected;
          const isVisible = isConnected && burnersMatch && hasAccount && !operatorMatch;
          setVisibleModals({ ...visibleModals, operatorUpdater: isVisible });
          if (isVisible) {
            setHelperText("Connected Burner does not match Account Operator");
          } else {
            setHelperText("");
          }
        }
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

        const actionID = `Setting Operator` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.set.operator(address);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions.Action, actionIndex);
      }

      const setPrivKey = (privKey: string) => {
        if (privKey.length > 0) {
          localStorage.setItem('operatorPrivateKey', privKey);
          setHelperText("Operator updated, please refresh!");
        }
      }

      const setValues = () => {
        setOperatorWithFx(newAddress);
        setPrivKey(newPrivKey);
      }

      const handleChangePublic = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewAddress(event.target.value);
      };

      const handleChangePrivate = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPrivKey(event.target.value);
      };

      /////////////////
      // DISPLAY

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, operatorUpdater: false });
      }, [setVisibleModals, visibleModals]);

      return (
        <ModalWrapperFull divName='operatorUpdater' id='operatorUpdater'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Update Operator</Title>
            <Description style={{ color: '#FF785B' }}>{helperText}</Description>
            <br />
            <Description>Current Operator: {accountDetails.operatorAddress}</Description>
            <Description>Connected Burner: {burnerInfo.connected}</Description>
            <Container id='new-operator'>
              <Label>new address</Label>
              <Input
                type='text'
                placeholder='new operator address'
                value={newAddress}
                onChange={(e) => handleChangePublic(e)}
              />
            </Container>
            <Container id='new-operator-priv'>
              <Label>new private key (optional)</Label>
              <Input
                type='text'
                placeholder='new operator private key (optional)'
                value={newPrivKey}
                onChange={(e) => handleChangePrivate(e)}
              />
            </Container>
            <ActionButton id={`submit`} text='Submit' onClick={setValues} />
          </ModalContent>
        </ModalWrapperFull>
      );
    }
  );
}


const ModalContent = styled.div`
  display: grid;
  justify-content: center;
  background-color: white;
  padding: 20px;
  width: 99%;
`;

const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Container = styled.div`
  width: 100%;
  margin: 20px 5px;
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: center;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Input = styled.input`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 5px 0px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const Label = styled.label`
  font-family: Pixel;
  font-size: 10px;
  color: #333;
  margin: 0px 5px;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;
