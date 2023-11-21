import { EntityID, EntityIndex } from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import crypto from "crypto";
import React, { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { useBalance } from 'wagmi';

import { defaultChain } from 'constants/chains';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import { playClick, playSuccess } from 'utils/sounds';
import 'layers/react/styles/font.css';


// TODO: check for whether an account with the burner address already exists
export function registerGasHarasser() {
  registerUIComponent(
    'GasHarasser',
    {
      colStart: 25,
      colEnd: 75,
      rowStart: 25,
      rowEnd: 70,
    },
    (layers) => of(layers),
    (layers) => {
      const { network: { actions, world } } = layers;
      const { selectedAddress, networks, validations: networkValidations } = useNetworkSettings();
      const { validators, setValidators } = useComponentSettings();
      const { account, validations, setValidations } = useKamiAccount();

      const [hasGas, setHasGas] = useState(false);
      const [isVisible, setIsVisible] = useState(false);
      const [value, setValue] = useState(.05);

      const { data: OperatorBal } = useBalance({
        address: account.operatorAddress as `0x${string}`,
        watch: true
      });

      // run the primary check(s) for this validator, track in store for easy access 
      useEffect(() => {
        const hasGas = Number(OperatorBal?.formatted) > 0;
        setHasGas(hasGas);
        setValidations({ ...validations, operatorHasGas: hasGas });
      }, [OperatorBal]);

      // determine visibility based on above/prev checks
      useEffect(() => {
        setIsVisible(
          defaultChain.id !== 31337 &&
          networkValidations.isConnected &&
          networkValidations.chainMatches &&
          networkValidations.burnerMatches &&
          validations.accountExists &&
          validations.operatorMatches &&
          !hasGas
        );
      }, [networkValidations, validations, hasGas]);

      // adjust actual visibility of windows based on above determination
      useEffect(() => {
        if (isVisible != validators.gasHarasser) {
          const { validators } = useComponentSettings.getState();
          setValidators({ ...validators, gasHarasser: isVisible });
        }
      }, [
        isVisible,
        validators.walletConnector,
        validators.burnerDetector,
        validators.accountRegistrar,
        validators.operatorUpdater,
      ]);


      /////////////////
      // ACTIONS

      const fundTx = async () => {
        const network = networks.get(selectedAddress);
        const account = network!.api.player.account;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'AccountFund',
          params: [value.toString()],
          description: `Funding Operator ${value.toString()}`,
          execute: async () => {
            return account.fund(value.toString());
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions!.Action, actionIndex);
      };


      /////////////////
      // FORM HANDLING

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = Number(event.target.value);
        newValue = Math.max(0.01, newValue);
        newValue = Math.min(0.1, newValue);
        setValue(newValue);
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          fundTx();
        }
      };

      const feed = async () => {
        playClick();
        await fundTx();
        playSuccess();
      }


      /////////////////
      // DISPLAY

      return (
        <ValidatorWrapper
          id='gas-harasser'
          divName='gasHarasser'
          title='Feed Your Operator'
          errorPrimary='Operator is EMPTY and STARVING'
          errorSecondary={`You're lucky we don't report you to the authorities..`}
        >
          <Description>Account Operator: {account.operatorAddress}</Description>
          <br />
          <Row>
            <Input
              type='number'
              value={value}
              step='0.01'
              onChange={(e) => handleChange(e)}
              onKeyDown={(e) => catchKeys(e)}
              style={{ pointerEvents: 'auto' }}
            />
            <ActionButton id={`feed`} text='Feed' onClick={feed} size='vending' />
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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;