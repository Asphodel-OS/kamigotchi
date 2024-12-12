import { EntityID, EntityIndex, getComponentValue } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { AccountCache, getAccount } from 'app/cache/account';
import { ActionButton, ValidatorWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { emptyAccountDetails, useAccount, useNetwork, useVisibility } from 'app/stores';
import { GodID, SyncState } from 'engine/constants';
import { getBaseAccount, queryAccountFromEmbedded, queryAllAccounts } from 'network/shapes/Account';
import { waitForActionCompletion } from 'network/utils';
import { Registration } from './Registration';
import { BackButton, Description, Row } from './shared';

export function registerAccountRegistrar() {
  registerUIComponent(
    'AccountRegistrar',
    {
      // positioning controlled by validator wrapper
      colStart: 0,
      colEnd: 0,
      rowStart: 0,
      rowEnd: 0,
    },
    (layers) => {
      const { network } = layers;
      const { world, components } = network;
      const { LoadingState } = components;

      // race condition present when updating by components, updates every second instead
      return interval(1000).pipe(
        map(() => {
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
              getBaseAccount: (entity: EntityIndex) => getBaseAccount(world, components, entity),
              getAccount: (entity: EntityIndex) => getAccount(world, components, entity),
              waitForActionCompletion: (action: EntityID) =>
                waitForActionCompletion(
                  network.actions.Action,
                  world.entityToIndex.get(action) as EntityIndex
                ),
            },
          };
        })
      );
    },

    ({ data, network, utils }) => {
      const { accountEntity } = data;
      const { getBaseAccount } = utils;
      const { actions } = network;

      const {
        burnerAddress, // embedded
        selectedAddress, // injected
        apis,
        validations: networkValidations,
      } = useNetwork();
      const { toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();
      const { setAccount: setKamiAccount } = useAccount();
      const { validations, setValidations } = useAccount();
      const [step, setStep] = useState(0);

      // update the Kami Account and validation based on changes to the
      // connected address and detected account in the world
      useEffect(() => {
        if (!!accountEntity == validations.accountExists) return; // no change
        if (accountEntity) {
          const account = getBaseAccount(accountEntity);
          setKamiAccount({ ...account });
          setValidations({ ...validations, accountExists: true });
        } else {
          setKamiAccount(emptyAccountDetails());
          setValidations({ accountExists: false, operatorMatches: false, operatorHasGas: false });
        }
      }, [selectedAddress, accountEntity]);

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

        if (isVisible != validators.accountRegistrar) {
          setValidators({
            walletConnector: false,
            accountRegistrar: isVisible,
            operatorUpdater: false,
            gasHarasser: false,
          });
        }
      }, [networkValidations, validations.accountExists, validators.walletConnector]);

      /////////////////
      // ACTION

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

      const NextButton = () => <ActionButton text='Next' onClick={() => setStep(step + 1)} />;

      const IntroStep1 = () => {
        return (
          <>
            <br />
            <Description>Welcome to Kamigotchi World.</Description>
            <Description>This world exists entirely on-chain.</Description>
            <br />
            <Row>
              <NextButton />
            </Row>
          </>
        );
      };
      const IntroStep2 = () => {
        return (
          <>
            <br />
            <Description>Kamigotchi are key to this world.</Description>
            <Description>You will need them to progress.</Description>
            <br />
            <Row>
              <BackButton step={step} setStep={setStep} />
              <NextButton />
            </Row>
          </>
        );
      };

      const GetSteps = () => {
        return [
          IntroStep1(),
          IntroStep2(),
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
    }
  );
}
