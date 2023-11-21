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
      const { burner, selectedAddress, networks, validations: networkValidations } = useNetworkSettings();
      const { toggleButtons, toggleModals } = useComponentSettings();
      const { validators, setValidators } = useComponentSettings();
      const { account: kamiAccount, validations, setValidations } = useKamiAccount();

      const [operatorMatches, setOperatorMatches] = useState(false);
      const [operatorTaken, setOperatorTaken] = useState(false);
      const [isVisible, setIsVisible] = useState(false);
      const [mode, setMode] = useState('key');
      const [value, setValue] = useState('');

      // run the primary check(s) for this validator, track in store for easy access 
      useEffect(() => {
        const operatorMatches = (kamiAccount.operatorAddress === burner.connected.address);
        setOperatorMatches(operatorMatches);
        setValidations({ ...validations, operatorMatches });
      }, [burner.connected.address, kamiAccount.operatorAddress]);

      // determine visibility based on above/prev checks
      useEffect(() => {
        setIsVisible(
          networkValidations.isConnected &&
          networkValidations.chainMatches &&
          networkValidations.burnerMatches &&
          validations.accountExists &&
          !operatorMatches
        );
      }, [networkValidations, validations, operatorMatches]);

      // adjust actual visibility of windows based on above determination
      useEffect(() => {
        if (isVisible) toggleModals(false);
        toggleButtons(
          !isVisible &&
          !validators.walletConnector &&
          !validators.burnerDetector &&
          !validators.accountRegistrar
        );
        if (isVisible != validators.operatorUpdater) {
          const { validators } = useComponentSettings.getState();
          setValidators({ ...validators, operatorUpdater: isVisible });
        }
      }, [
        isVisible,
        validators.walletConnector,
        validators.burnerDetector,
        validators.accountRegistrar,
      ]);

      // check if the connected burner is already taken by an account
      useEffect(() => {
        const account = getAccountByOperator(layers, burner.connected.address)
        setOperatorTaken(!!account.id);
      }, [mode, burner.connected.address]);


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
          description: `Setting Account Avatar to ${address}`,
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
          ? `Private Key of ${kamiAccount.operatorAddress}`
          : "Address of New Avatar for Account";
      }

      const getPlaceholder = () => {
        return (mode === 'key')
          ? "0x..."
          : "Any ol' Avatar will do...";
      }


      /////////////////
      // RENDERING

      const SupportButton = () => {
        let button = (
          <Tooltip text={[`you're ngmi..`]}>
            <ActionButton
              id={`generate`}
              text={`I'm feeling Lucky`}
              onClick={() => setValue(generatePrivateKey())}
            />
          </Tooltip>
        );

        if (mode === 'address') {
          button = (
            <ActionButton
              id={`copy`}
              text='Use connected one'
              onClick={() => setValue(burner.connected.address)}
              disabled={operatorTaken}
            />
          );
          if (operatorTaken) {
            button = (
              <Tooltip text={['This Avatar is taken by another account']}>
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
          title='Update Avatar'
          errorPrimary='Connected Burner != Account Avatar'
        >
          <Description>Account Avatar: {kamiAccount.operatorAddress}</Description>
          <Description>Connected Burner: {burner.connected.address}</Description>
          <br />
          <WarningOption onClick={() => handleSetMode('key')}>
            {(mode === 'key') ? '→ ' : ''}Please, find your keys {kamiAccount.name}
          </WarningOption>
          <WarningOption onClick={() => handleSetMode('address')}>
            {(mode !== 'key') ? '→ ' : ''}or replace your current Avatar
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


const Description = styled.div`
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