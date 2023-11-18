import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from "crypto";
import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useLocalStorage } from 'layers/react/hooks/useLocalStorage'
import { getAccountByOperator } from 'layers/react/shapes/Account';
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
      const [_, setDetectedPrivateKey] = useLocalStorage('operatorPrivateKey', '');
      const { details: accountDetails } = useKamiAccount();
      const { burnerInfo, selectedAddress, networks } = useNetworkSettings();
      const { toggleButtons, toggleFixtures, toggleModals } = useComponentSettings();
      const { validators, setValidators } = useComponentSettings();

      const [mode, setMode] = useState('key');
      const [value, setValue] = useState('');
      const [operatorTaken, setOperatorTaken] = useState(false);
      const [isVisible, setIsVisible] = useState(false);


      // track the account details in store for easy access
      // expose/hide components accordingly
      useEffect(() => {
        const operatorMatch = accountDetails.operatorAddress === burnerInfo.connected;
        const meetsPreconditions = (
          !validators.walletConnector
          && !validators.burnerDetector
          && !validators.accountRegistrar
        );

        if (meetsPreconditions) {
          if (!operatorMatch) {
            toggleButtons(false);
            toggleModals(false);
          } else {
            toggleButtons(true);
            toggleFixtures(true);
          }
        }
        setIsVisible(meetsPreconditions && !operatorMatch);
      }, [
        validators.walletConnector,
        validators.burnerDetector,
        validators.accountRegistrar,
        burnerInfo.connected,
        accountDetails.operatorAddress
      ]);

      // visibility effect hook. updated outside of the above to avoid race conditions
      useEffect(() => {
        setValidators({ ...validators, operatorUpdater: isVisible });
      }, [isVisible]);

      // check if the connected burner is already taken by an account
      useEffect(() => {
        const account = getAccountByOperator(layers, burnerInfo.connected)
        setOperatorTaken(!!account.id);
      }, [mode, burnerInfo.connected]);

      /////////////////
      // ACTIONS

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

      const setOperatorWithFx = async (address: string) => {
        playScribble();
        await setOperator(address);
        playSuccess();
      }

      const setPrivKey = (privKey: string) => {
        playScribble();
        if (privKey.length > 0) {
          setDetectedPrivateKey(privKey);
        }
      }


      /////////////////
      // FORM HANDLING

      const handleSetMode = (newMode: string) => {
        playClick();
        setMode(newMode);
        setValue('');
      }

      const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
      };

      const submit = () => {
        if (mode === 'key') setPrivKey(value);
        else setOperatorWithFx(value);
      }

      const getLabel = () => {
        return (mode === 'key')
          ? `Private Key of ${accountDetails.operatorAddress}`
          : "Address of New Operator for Account";
      }

      const getPlaceholder = () => {
        return (mode === 'key')
          ? "0x..."
          : "Any ol' Operator will do...";
      }


      /////////////////
      // RENDERING

      const SupportButton = () => {
        let button = (
          <Tooltip text={['you\'re ngmi..']}>
            <ActionButton
              id={`generate`}
              text="I'm feeling Lucky"
              onClick={() => setValue(generatePrivateKey())}
            />
          </Tooltip>
        );

        if (mode === 'address') {
          button = (
            <ActionButton
              id={`copy`}
              text='Use connected one'
              onClick={() => setValue(burnerInfo.connected)}
              disabled={operatorTaken}
            />
          );
          if (operatorTaken) {
            button = (
              <Tooltip text={['This Operator is taken by another account']}>
                {button}
              </Tooltip>
            );
          }
        }

        return button;
      }


      /////////////////
      // DISPLAY

      return (
        <ValidatorWrapper
          id='operator-updater'
          divName='operatorUpdater'
          title='Update Operator'
          errorPrimary='Connected Burner != Account Operator'
        >
          <Description>Account Operator: {accountDetails.operatorAddress}</Description>
          <Description>Connected Burner: {burnerInfo.connected}</Description>
          <br />
          <WarningOption onClick={() => handleSetMode('key')}>
            {(mode === 'key') ? '→ ' : ''}Please, find your keys {accountDetails.name}
          </WarningOption>
          <WarningOption onClick={() => handleSetMode('address')}>
            {(mode !== 'key') ? '→ ' : ''}or replace your current Operator
          </WarningOption>
          <br />
          <InputContainer id='new-operator'>
            <Label>{getLabel()}</Label>
            <Input
              type='text'
              placeholder={getPlaceholder()}
              value={value}
              onChange={(e) => handleInputChange(e)}
            />
          </InputContainer>
          <Row>
            <SupportButton />
            <ActionButton id={`submit`} text='Submit' onClick={submit} />
          </Row>
        </ValidatorWrapper>
      );
    }
  );
}


const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;


const WarningOption = styled.div`
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

const InputContainer = styled.div`
  width: 100%;
  margin: 20px 5px;
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: center;
`;

const Input = styled.input`
  background-color: #ffffff;
  border: solid black 2px;
  border-radius: 5px;
  padding: 15px 12px;
  margin: 5px 0px;
  
  display: inline-block;
  justify-content: center;
  cursor: pointer;
  color: black;

  font-family: Pixel;
  font-size: 12px;
  text-align: left;
  text-decoration: none;
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
