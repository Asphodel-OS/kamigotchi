import { EntityID, EntityIndex, getComponentValue } from 'engine/recs';
import { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { AccountCache, getAccount } from 'app/cache/account';
import { ValidatorWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { emptyAccountDetails, useAccount, useNetwork, useTokens, useVisibility } from 'app/stores';
import { GodID, SyncState } from 'engine/constants';
import {
  getBaseAccount as _getBaseAccount,
  queryAccountFromEmbedded,
  queryAllAccounts,
} from 'network/shapes/Account';
import { waitForActionCompletion } from 'network/utils';
import { GasConstants } from 'constants/gas';
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
          isLive: loadingState?.state === SyncState.LIVE,
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

    const { accountEntity, isLive } = data;
    const { getBaseAccount } = utils;
    const { actions } = network;

    const apis = useNetwork((s) => s.apis);
    const burnerAddress = useNetwork((s) => s.burnerAddress); // embedded
    const selectedAddress = useNetwork((s) => s.selectedAddress); // injected
    const networkValidations = useNetwork((s) => s.validations);

    const toggleModals = useVisibility((s) => s.toggleModals);
    const toggleFixtures = useVisibility((s) => s.toggleFixtures);
    const accountRegistrarVisible = useVisibility((s) => s.validators.accountRegistrar);
    const bridgeFlowActive = useVisibility((s) => s.modals.bridge || s.bridgeProcessActive);
    const setValidators = useVisibility((s) => s.setValidators);

    const validations = useAccount((s) => s.validations);
    const setValidations = useAccount((s) => s.setValidations);
    const setAccount = useAccount((s) => s.setAccount);

    const ethBalance = useTokens((s) => s.eth.balance);

    /////////////////
    // SUBSCRIPTION

    // update the Kami Account and validation based on changes to the
    // connected address and detected account in the world.
    // Two gates prevent premature evaluation:
    //   isLive: ECS world must be synced (accountEntity is meaningless before)
    //   burnerAddress: embedded wallet must be established (queryAccountFromEmbedded
    //     uses MUD's connectedAddress which is only set after updateNetworkLayer)
    const DEAD = '0x000000000000000000000000000000000000dEaD';
    useEffect(() => {
      if (!isLive) return;
      if (burnerAddress === DEAD) return;

      if (accountEntity) {
        const account = getBaseAccount(accountEntity);
        // Only mark accountExists once we have valid account data populated,
        // so downstream validators (OperatorUpdater) don't see the dead default address.
        const hasValidOperator =
          !!account.operatorAddress &&
          account.operatorAddress !== DEAD;
        if (hasValidOperator) {
          setAccount({ ...account });
          setValidations({ ...validations, accountChecked: true, accountExists: true });
        }
      } else {
        setAccount(emptyAccountDetails());
        setValidations({ accountChecked: true, accountExists: false, operatorMatches: false, operatorHasGas: true });
      }
    }, [accountEntity, isLive, burnerAddress]);

    // adjust visibility of windows based on above determination
    useEffect(() => {
      // Keep registration visible while bridge modal is active.
      if (bridgeFlowActive) return;

      const isValidated = networkValidations.authenticated && networkValidations.chainMatches;
      // If user is in registration flow, don't hide this validator just because
      // chain validation changed after bridge interactions.
      if (!validations.accountExists && accountRegistrarVisible && !isValidated) return;

      const isVisible = isValidated && validations.accountChecked && !validations.accountExists;

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
    }, [networkValidations, validations.accountChecked, validations.accountExists, bridgeFlowActive]);

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

    const needsBridge = ethBalance < GasConstants.Empty && import.meta.env.MODE !== 'puter';

    return (
      <ValidatorWrapper
        id='account-registrar'
        divName='accountRegistrar'
        title='Welcome'
        subtitle={
          needsBridge
            ? 'You need to bridge Ether to Yominet.'
            : 'You need to create an Operator account.'
        }
      >
        <Registration
          address={{
            selected: selectedAddress,
            burner: burnerAddress,
          }}
          actions={{ createAccount }}
          utils={{
            toggleFixtures,
            waitForActionCompletion: utils.waitForActionCompletion,
          }}
        />
      </ValidatorWrapper>
    );
  },
};
