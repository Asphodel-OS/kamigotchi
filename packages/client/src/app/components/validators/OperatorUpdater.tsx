import { EntityID, EntityIndex } from '@mud-classic/recs';
import { waitForActionCompletion } from 'network/utils';
import { useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { ActionButton, ValidatorWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useAccount, useNetwork, useVisibility } from 'app/stores';
import { addressesMatch } from 'utils/address';
import { playScribble, playSuccess } from 'utils/sounds';

// TODO: check for whether an account with the burner address already exists
export const OperatorUpdater: UIComponent = {
  id: 'OperatorUpdater',
  Render: () => {
      const layers = useLayers();
      const { network } = layers;
      const { actions, world } = network;

      const { account: kamiAccount, validations, setValidations } = useAccount();
      const { burnerAddress, selectedAddress } = useNetwork();
      const { apis, validations: networkValidations } = useNetwork();
      const { toggleModals } = useVisibility();
      const { validators, setValidators } = useVisibility();

      // run the primary check(s) for this validator, track in store for easy saccess
      useEffect(() => {
        if (!validations.accountExists) return;
        const operatorMatches = addressesMatch(kamiAccount.operatorAddress, burnerAddress);
        if (operatorMatches == validations.operatorMatches) return; // no change
        setValidations({ ...validations, operatorMatches });
      }, [validations.accountExists, burnerAddress, kamiAccount.operatorAddress]);

      // adjust visibility of visual components based on above determination
      useEffect(() => {
        const isVisible =
          networkValidations.authenticated &&
          networkValidations.chainMatches &&
          validations.accountExists &&
          !validations.operatorMatches;

        if (isVisible) toggleModals(false);
        if (isVisible != validators.operatorUpdater) {
          setValidators({
            walletConnector: false,
            accountRegistrar: false,
            operatorUpdater: isVisible,
            gasHarasser: false,
          });
        }
      }, [networkValidations, validations.accountExists, validations.operatorMatches]);

      /////////////////
      // ACTIONS

      const setOperator = async (address: string) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'AccountSetOperator',
          params: [address],
          description: `Setting Account Operator to 0x..${address.slice(-4)}`,
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
          title='Update Operator'
          errorPrimary='Connected Burner != Account Operator'
        >
          <Description>Old Operator: {kamiAccount.operatorAddress}</Description>
          <Description>New Operator: {burnerAddress}</Description>
          <br />
          <Row>
            <ActionButton text='Update' onClick={handleSubmit} />
          </Row>
        </ValidatorWrapper>
      );
  },
};

const Description = styled.div`
  color: #333;
  padding: 0.9em 0;
  font-size: 0.75em;
  text-align: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
