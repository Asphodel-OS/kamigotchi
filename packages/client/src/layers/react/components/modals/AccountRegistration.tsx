/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EntityID, EntityIndex, HasValue, runQuery } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import React, { useEffect, useState, useCallback } from 'react';
import { map, merge, of } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount } from 'wagmi';

import { registerUIComponent } from 'layers/react/engine/store';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import 'layers/react/styles/font.css';
import mintSound from 'assets/sound/fx/vending_machine.mp3';
import scribbleSound from 'assets/sound/fx/scribbling.mp3';
import successSound from 'assets/sound/fx/bubble_success.mp3';

export function registerAccountRegistrationModal() {
  registerUIComponent(
    'AccountRegistration',
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
        },
      } = layers;

      return merge(IsAccount.update$, OwnerAddress.update$).pipe(
        map(() => {
          return {
            network: layers.network.network,
          };
        })
      );
    },

    ({ network }) => {
      const burnerAddress = network.connectedAddress.get();
      const { isConnected } = useAccount();
      const { details: accountDetails } = useKamiAccount();
      const { sound: { volume }, networks, selectedAddress, toggleVisibleButtons } = dataStore();
      const [name, setName] = useState('');

      // toggle buttons based on whether account is detected
      useEffect(() => {
        if (accountDetails.id) toggleVisibleButtons(true);
        else toggleVisibleButtons(false);
      }, [accountDetails]);

      const playSound = (sound: any) => {
        const soundFx = new Audio(sound);
        soundFx.volume = volume;
        soundFx.play();
      }

      const createAccount = async (
        ownerAddress: string,
        operatorAddress: string,
        name: string
      ) => {
        console.log(networks);
        const {
          actions,
          api: { player },
          world,
        } = networks.get(ownerAddress);

        const actionID = `Creating Account` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return player.account.register(operatorAddress, name);
          },
        });

        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        const actionCompletion = await waitForActionCompletion(actions.Action, actionIndex);
        console.log('action return value', actionCompletion);

        // openKamiModal(pet.entityIndex);
      }

      const createAccountWithFx = async (
        ownerAddr: string,
        operatorAddr: string,
        name: string
      ) => {
        playSound(scribbleSound);
        await createAccount(ownerAddr, operatorAddr, name);
        playSound(successSound);
      }

      const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          console.log(burnerAddress);
          createAccountWithFx(selectedAddress, burnerAddress!, name);
        }
      };


      /////////////////
      // DISPLAY

      // how to render the modal
      const modalDisplay = () => (
        (isConnected && !accountDetails.index) ? 'block' : 'none'
      );

      return (
        <ModalWrapper id='accountRegistration' style={{ display: modalDisplay() }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Register Your Account</Title>
            <br />
            <Description>Owner Address: {selectedAddress}</Description>
            <br />
            <Description>Operator Address: {burnerAddress}</Description>
            <Description>Operator PrivKey: (should make this copyable)</Description>
            <Description>Note: we also want tooltips here on hover</Description>
            <NameInput
              type='text'
              placeholder='username'
              value={name}
              onKeyDown={(e) => catchKeys(e)}
              onChange={(e) => handleNameChange(e)}
            />
            <ActionButton
              id={`create-account`}
              onClick={() => createAccountWithFx(selectedAddress!, burnerAddress!, name)}
              text='Submit'
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

const NameInput = styled.input`
  width: 100%;

  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 10px 5px 5px 5px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
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
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;
