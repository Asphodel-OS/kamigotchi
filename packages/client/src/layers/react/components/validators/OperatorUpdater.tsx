import { EntityID, EntityIndex } from '@mud-classic/recs';
import { waitForActionCompletion } from 'layers/network/utils';
import { useEffect, useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useAccount, useNetwork, useVisibility } from 'layers/react/store';
import 'layers/react/styles/font.css';
import { playScribble, playSuccess } from 'utils/sounds';

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
      const { network } = layers;
      const { actions, world } = network;

      const { account: kamiAccount, validations, setValidations } = useAccount();
      const { burnerAddress, selectedAddress } = useNetwork();
      const { apis, validations: networkValidations } = useNetwork();
      const { toggleButtons, toggleModals } = useVisibility();
      const { validators, setValidators } = useVisibility();

      const [operatorMatches, setOperatorMatches] = useState(false);
      const [isVisible, setIsVisible] = useState(false);

      // run the primary check(s) for this validator, track in store for easy access
      useEffect(() => {
        const operatorMatches = kamiAccount.operatorAddress === burnerAddress;
        setOperatorMatches(operatorMatches);
        setValidations({ ...validations, operatorMatches });
      }, [burnerAddress, kamiAccount.operatorAddress]);

      // determine visibility of this validator based on above checks
      useEffect(() => {
        setIsVisible(
          networkValidations.authenticated &&
            networkValidations.chainMatches &&
            validations.accountExists &&
            !operatorMatches
        );
      }, [networkValidations, validations, operatorMatches]);

      // adjust visibility of visual components based on above determination
      useEffect(() => {
        if (isVisible) toggleModals(false);
        toggleButtons(!isVisible && !validators.walletConnector && !validators.accountRegistrar);
        if (isVisible != validators.operatorUpdater) {
          const { validators } = useVisibility.getState();
          setValidators({ ...validators, operatorUpdater: isVisible });
        }
      }, [isVisible, validators.walletConnector, validators.accountRegistrar]);

      /////////////////
      // ACTIONS

      const setOperator = async (address: string) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'AccountSetOperator',
          params: [address],
          description: `Setting Account Avatar to 0x..${address.slice(-4)}`,
          execute: async () => {
            return api.account.set.operator(address);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions.Action, actionIndex);
      };

      const setOperatorWithFx = async (address: string) => {
        playScribble();
        await setOperator(address);
        playSuccess();
      };

      const handleSubmit = () => {
        setOperatorWithFx(burnerAddress);
      };

      /////////////////
      // DISPLAY

      return (
        <ValidatorWrapper
          id='operator-updater'
          divName='operatorUpdater'
          title='Update Avatar'
          errorPrimary='Connected Burner != Account Avatar'
        >
          <Description>Old Avatar: {kamiAccount.operatorAddress}</Description>
          <Description>New Avatar: {burnerAddress}</Description>
          <br />
          <Row>
            <ActionButton text='Update' onClick={handleSubmit} size='vending' />
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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
