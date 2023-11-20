import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from "crypto";

import { defaultChain } from 'constants/chains';
import { useLocalStorage } from 'layers/react/hooks/useLocalStorage'
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { generatePrivateKey } from 'utils/address';
import { playClick, playScribble, playSuccess } from 'utils/sounds';
import 'layers/react/styles/font.css';


// TODO: check for whether an account with the burner address already exists
export function registerOperatorUpdater() {
  registerUIComponent(
    'OperatorUpdater',
    {
      colStart: 20,
      colEnd: 80,
      rowStart: 25,
      rowEnd: 70,
    },
    (layers) => of(layers),
    (layers) => {
      const { network: { actions } } = layers;
      const { isConnected } = useAccount();
      const { chain } = useNetwork();
      const { account: accountDetails } = useKamiAccount();
      const [_, setDetectedPrivateKey] = useLocalStorage('operatorPrivateKey', '');
      const { burner, selectedAddress, networks } = useNetworkSettings();
      const { modals, setModals } = useComponentSettings();
      const { toggleButtons, toggleFixtures } = useComponentSettings();

      const [isMismatched, setIsMismatched] = useState(false);
      const [mode, setMode] = useState('key');
      const [value, setValue] = useState('');

      // toggle visibility based on many things
      useEffect(() => {
        const burnersMatch = burner.connected.address === burner.detected.address;
        const networksMatch = chain?.id === defaultChain.id;
        const hasAccount = !!accountDetails.id;
        const meetsPreconditions = isConnected && networksMatch && burnersMatch && hasAccount;

        const operatorMatch = accountDetails.operatorAddress === burner.connected.address;
        const isVisible = (meetsPreconditions && !operatorMatch);
        setModals({ ...modals, operatorUpdater: isVisible });
        setIsMismatched(!operatorMatch);

        // awkward place to put this trigger, but this is the last validator to be checked
        if (meetsPreconditions && operatorMatch) {
          toggleButtons(true);
          toggleFixtures(true);
        }
      }, [isConnected, burner, accountDetails.operatorAddress]);


      /////////////////
      // ACTIONS

      const setOperatorWithFx = async (address: string) => {
        playScribble();
        await setOperator(address);
        playSuccess();
      }

      const setOperator = async (address: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
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
      }

      const setPrivKey = (privKey: string) => {
        playScribble();
        if (privKey.length > 0) {
          setDetectedPrivateKey(privKey);
        }
      }


      /////////////////
      // FORM HANDLING

      const submit = () => {
        if (mode === 'key') setPrivKey(value);
        else setOperatorWithFx(value);
      }

      const generate = () => {
        const privKey = generatePrivateKey();
        setValue(privKey);
      }

      const copy = () => {
        setValue(burner.connected.address);
      }

      const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
      };

      const getLabel = () => {
        return (mode === 'key')
          ? "Private Key of Current Operator on Account"
          : "Address of New Operator for Account";
      }

      const getPlaceholder = () => {
        return (mode === 'key')
          ? `Private Key of ${accountDetails.operatorAddress}`
          : "Any ol' Operator will do...";
      }

      const handleSetMode = (newMode: string) => {
        playClick();
        setMode(newMode);
        setValue('');
      }


      /////////////////
      // DISPLAY

      return (
        <ModalWrapperFull divName='operatorUpdater' id='operatorUpdater' canExit={!isMismatched}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Update Operator</Title>
            <Warning>Connected Burner != Account Operator</Warning>
            <br />
            <Description>Account Operator: {accountDetails.operatorAddress}</Description>
            <Description>Connected Burner: {burner.connected.address}</Description>
            <br />
            <Warning2 onClick={() => handleSetMode('key')}>
              {(mode === 'key') ? '→ ' : ''}Please find your keys, {accountDetails.name}
            </Warning2>
            <Warning2 onClick={() => handleSetMode('address')}>
              {(mode !== 'key') ? '→ ' : ''}Or you'll have to find a new Operator
            </Warning2>
            <br />
            <Container id='new-operator'>
              <Label>{getLabel()}</Label>
              <Input
                type='text'
                placeholder={getPlaceholder()}
                value={value}
                onChange={(e) => handleInputChange(e)}
              />
            </Container>
            <Row>
              {(mode === 'key')
                ? <ActionButton id={`generate`} text="I'm feeling Lucky" onClick={generate} />
                : <ActionButton id={`copy`} text='Use connected one' onClick={copy} />
              }
              <ActionButton id={`submit`} text='Submit' onClick={submit} />
            </Row>
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
  padding: 3vw;
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

const Warning = styled.p`
  font-size: 12px;
  color: #FF785B;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Warning2 = styled.p`
  font-size: 12px;
  color: #FF785B;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;

  cursor: pointer;
  &:hover {
    color: #FF785B;
    text-decoration: underline;
  }
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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
