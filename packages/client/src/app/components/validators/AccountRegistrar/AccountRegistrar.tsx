import { EntityID, EntityIndex, getComponentValue } from 'engine/recs';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { AccountCache, getAccount } from 'app/cache/account';
import { ValidatorWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { emptyAccountDetails, useAccount, useNetwork, useVisibility } from 'app/stores';
import { GodID, SyncState } from 'engine/constants';
import {
  getBaseAccount as _getBaseAccount,
  queryAccountFromEmbedded,
  queryAllAccounts,
} from 'network/shapes/Account';
import { waitForActionCompletion } from 'network/utils';
import { IntroStep1, IntroStep2 } from './IntroSteps';
import { Registration } from './Registration';

export const AccountRegistrar: UIComponent = {
  id: 'AccountRegistrar',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { data, network, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const { LoadingState } = components;
      const accountEntity = queryAccountFromEmbedded(network);

      // load accounts after the data has loaded
      const GodEntityIndex = world.entityToIndex.get(GodID) as EntityIndex;
      const loadingState = getComponentValue(LoadingState, GodEntityIndex);
      if (loadingState?.state === SyncState.LIVE) {
        const accountEntities = queryAllAccounts(components);

        // NOTE: this is meant to get the accounts only once after loading
        // the game. an off by one error here likely indicates we attempt to
        // load the account prematurely elsewhere
        if (accountEntities.length > AccountCache.size) {
          accountEntities.map((entity) => getAccount(world, components, entity));
        }
      }

      return {
        data: {
          accountEntity,
        },
        network,
        utils: {
          getBaseAccount: (entity: EntityIndex) => _getBaseAccount(world, components, entity),
          waitForActionCompletion: (action: EntityID) =>
            waitForActionCompletion(
              network.actions.Action,
              world.entityToIndex.get(action) as EntityIndex
            ),
        },
      };
    })();

    /////////////////
    // INSTANTIATION

    const { accountEntity } = data;
    const { getBaseAccount } = utils;
    const { actions } = network;

    const apis = useNetwork((s) => s.apis);
    const burnerAddress = useNetwork((s) => s.burnerAddress); // embedded
    const selectedAddress = useNetwork((s) => s.selectedAddress); // injected
    const networkValidations = useNetwork((s) => s.validations);

    const toggleModals = useVisibility((s) => s.toggleModals);
    const toggleFixtures = useVisibility((s) => s.toggleFixtures);
    const accountRegistrarVisible = useVisibility((s) => s.validators.accountRegistrar);
    const walletConnectorVisible = useVisibility((s) => s.validators.walletConnector);
    const setValidators = useVisibility((s) => s.setValidators);

    const validations = useAccount((s) => s.validations);
    const setValidations = useAccount((s) => s.setValidations);
    const setAccount = useAccount((s) => s.setAccount);

    const [step, setStep] = useState(0);

    /////////////////
    // SUBSCRIPTION

    // update the Kami Account and validation based on changes to the
    // connected address and detected account in the world
    useEffect(() => {
      if (accountEntity) {
        const account = getBaseAccount(accountEntity);
        setAccount({ ...account });
        setValidations({ ...validations, accountExists: true });
      } else {
        setAccount(emptyAccountDetails());
        setValidations({ accountExists: false, operatorMatches: false, operatorHasGas: false });
      }
    }, [accountEntity]);

    // adjust visibility of windows based on above determination
    useEffect(() => {
      const isValidated = networkValidations.authenticated && networkValidations.chainMatches;
      const isVisible = isValidated && !validations.accountExists;

      if (isVisible) {
        toggleModals(false);
        toggleFixtures(false);
      } else if (isValidated && validations.accountExists) {
        toggleFixtures(true);
      }

      if (isVisible != accountRegistrarVisible) {
        setValidators({
          walletConnector: false,
          accountRegistrar: isVisible,
          operatorUpdater: false,
          gasHarasser: false,
        });
      }
    }, [networkValidations, validations.accountExists, walletConnectorVisible]);

    /////////////////
    // ACTIONS

    const createAccount = (username: string) => {
      const api = apis.get(selectedAddress);
      if (!api) return console.error(`API not established for ${selectedAddress}`);
      console.log(`CREATING ACCOUNT (${username}): ${selectedAddress}`);

      const connectedBurner = burnerAddress;
      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'AccountCreate',
        params: [connectedBurner, username],
        description: `Creating Account for ${username}`,
        execute: async () => {
          return api.account.register(connectedBurner, username);
        },
      });
      return actionID;
    };

    /////////////////
    // RENDERING

    const GetSteps = () => {
      return [
        <IntroStep1 step={step} setStep={setStep} />,
        <IntroStep2 step={step} setStep={setStep} />,
        <Registration
          address={{
            selected: selectedAddress,
            burner: burnerAddress,
          }}
          actions={{ createAccount }}
          utils={{
            setStep,
            toggleFixtures,
            waitForActionCompletion: utils.waitForActionCompletion,
          }}
        />,
      ];
    };

    /////////////////
    // DISPLAY

    return (
      <ValidatorWrapper
        id='account-registrar'
        divName='accountRegistrar'
        title='Welcome'
        subtitle='You must register an Account.'
      >
        {GetSteps()[step]}
      </ValidatorWrapper>
    );
  },
};
