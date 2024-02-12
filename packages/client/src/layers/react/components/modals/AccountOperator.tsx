import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from 'crypto';
import React, { useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useAccount } from 'layers/react/store/account';
import { useNetwork } from 'layers/react/store/network';
import { playScribble, playSuccess } from 'utils/sounds';

import 'layers/react/styles/font.css';

// TODO: check for whether an account with the burner address already exists
export function registerAccountOperator() {
  registerUIComponent(
    'AccountOperator',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 25,
      rowEnd: 70,
    },
    (layers) => of(layers),
    (layers) => {
      const {
        network: { actions },
      } = layers;
      const { account: kamiAccount } = useAccount();
      const { burner, selectedAddress, networks } = useNetwork();

      const [helperText, setHelperText] = useState('');
      const [newAddress, setNewAddress] = useState('');
      const [newPrivKey, setNewPrivKey] = useState('');

      /////////////////
      // ACTIONS

      const setOperatorWithFx = async (address: string) => {
        playScribble();
        await setOperator(address);
        playSuccess();
      };

      const setOperator = async (address: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString('hex') as EntityID;
        actions?.add({
          id: actionID,
          action: 'AccountSetOperator',
          params: [address],
          description: `Setting Account Operator to ${address}`,
          execute: async () => {
            return api.account.set.operator(address);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions?.Action!, actionIndex);
      };

      const setPrivKey = (privKey: string) => {
        if (privKey.length > 0) {
          localStorage.setItem('operatorPrivateKey', privKey);
          setHelperText('Operator updated, please refresh!');
        }
      };

      const setValues = () => {
        if (newAddress != '') setOperatorWithFx(newAddress);
        if (newPrivKey != '') setPrivKey(newPrivKey);
      };

      const handleChangePublic = (
        event: React.ChangeEvent<HTMLInputElement>
      ) => {
        setNewAddress(event.target.value);
      };

      const handleChangePrivate = (
        event: React.ChangeEvent<HTMLInputElement>
      ) => {
        setNewPrivKey(event.target.value);
      };

      /////////////////
      // DISPLAY

      return (
        <ModalWrapper divName='accountOperator' id='accountOperator' canExit>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Update Operator</Title>
            <Description style={{ color: '#FF785B' }}>{helperText}</Description>
            <br />
            <Description>
              Current Operator: {kamiAccount.operatorAddress}
            </Description>
            <Description>
              Connected Burner: {burner.connected.address}
            </Description>
            <Container id='new-operator'>
              <Label>new address (optional)</Label>
              <Input
                type='text'
                placeholder='update account operator address'
                value={newAddress}
                onChange={(e) => handleChangePublic(e)}
              />
            </Container>
            <Container id='new-operator-priv'>
              <Label>new private key (optional)</Label>
              <Input
                type='text'
                placeholder='update connected operator private key'
                value={newPrivKey}
                onChange={(e) => handleChangePrivate(e)}
              />
            </Container>
            <ActionButton id={`submit`} text='Submit' onClick={setValues} />
          </ModalContent>
        </ModalWrapper>
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
