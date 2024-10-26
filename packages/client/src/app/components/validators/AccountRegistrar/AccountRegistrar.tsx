import { EntityID, EntityIndex, HasValue, getComponentValue, runQuery } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { ActionButton, ValidatorWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import {
  Account as KamiAccount,
  emptyAccountDetails,
  useAccount,
  useNetwork,
  useVisibility,
} from 'app/stores';
import {
  Account,
  getAccount,
  queryAccountByName,
  queryAccountByOwner,
} from 'network/shapes/Account';
import { waitForActionCompletion } from 'network/utils';
import { Registration } from './Registration';
import { BackButton, Description, Row } from './shared';

/**
 * The primary purpose of this here monstrosity is to keep track of the connected Kami Account
 * based on the connected wallet address. Unfortunately, this means listening to both changes
 * in the Connector's address through State hooks, as well as to subscribed world components
 * on the Requirement step that may result in the creation of an account in-world.
 *
 * The requirement step determines the Account's EntityIndex using a mirrored address saved on the
 * zustand store as wagmi's useAccount() is unavailable outside of React components. It is also
 * necessary to properly update the modal whenever the page is refreshed, causing a repopulation of
 * the world client-side.
 *
 * The modal component then takes this index as a prop and simply listens to it. Nothing more. It
 * instead relies on a hook to the Same zustand store item for the Same connected account because
 * it's possible either side may be stale.
 *
 * Let's not fool ourselves into thinking this is an elegant solution by any measure. It is an
 * abomination birthed out of necessity and should be treated as such.
 */

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
      const { AccountIndex, EntityType, Name, OperatorAddress, OwnerAddress } = components;

      // TODO?: replace this with getAccount shape
      const getAccountDetails = (entityIndex: EntityIndex): KamiAccount => {
        if (!entityIndex) return emptyAccountDetails();
        return {
          id: world.entities[entityIndex],
          entityIndex: entityIndex,
          index: getComponentValue(AccountIndex, entityIndex)?.value as number,
          ownerAddress: getComponentValue(OwnerAddress, entityIndex)?.value as string,
          operatorAddress: getComponentValue(OperatorAddress, entityIndex)?.value as string,
          name: getComponentValue(Name, entityIndex)?.value as string,
        };
      };

      // takes in a standard Account shape and converts it to a Kami Account shape
      // defaults any missing values to the current Kami Account in the store.
      const getKamiAccount = (account: Account, fallback: KamiAccount): KamiAccount => {
        return {
          id: account.id ?? fallback.id,
          entityIndex: account.entityIndex ?? fallback.entityIndex,
          index: account.index ?? fallback.index,
          ownerAddress: account.ownerEOA ?? fallback.ownerAddress,
          operatorAddress: account.operatorEOA ?? fallback.operatorAddress,
          name: account.name ?? fallback.name,
        };
      };

      const getAccountIndexFromOwner = (ownerAddress: string): EntityIndex => {
        const accountIndex = Array.from(
          runQuery([
            HasValue(OwnerAddress, { value: ownerAddress }),
            HasValue(EntityType, { value: 'ACCOUNT' }),
          ])
        )[0];
        return accountIndex;
      };

      // race condition present when updating by components, updates every second instead
      return interval(1000).pipe(
        map(() => {
          const { selectedAddress } = useNetwork.getState();
          const accountIndexUpdatedByWorld = getAccountIndexFromOwner(selectedAddress);
          const accountFromWorldUpdate = getAccountDetails(accountIndexUpdatedByWorld);
          const operatorAddresses = new Set(OperatorAddress.values.value.values());
          return {
            data: {
              accountFromWorldUpdate,
              operatorAddresses,
            },
            utils: {
              queryAccountByName: (name: string) => queryAccountByName(components, name),
              getKamiAccount,
              waitForActionCompletion: (action: EntityID) =>
                waitForActionCompletion(
                  network.actions.Action,
                  world.entityToIndex.get(action) as EntityIndex
                ),
            },
            network,
          };
        })
      );
    },

    ({ data, utils, network }) => {
      const { accountFromWorldUpdate, operatorAddresses } = data;
      const { getKamiAccount, queryAccountByName } = utils;
      const { actions, components, world } = network;

      const {
        burnerAddress,
        selectedAddress,
        apis,
        validations: networkValidations,
      } = useNetwork();
      const { toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();
      const { account: kamiAccount, setAccount: setKamiAccount } = useAccount();
      const { validations, setValidations } = useAccount();
      const [step, setStep] = useState(0);

      // update the Kami Account and validation based on changes to the
      // connected address and detected account in the world
      useEffect(() => {
        const accountEntity = queryAccountByOwner(components, selectedAddress);
        if (!!accountEntity == validations.accountExists) return; // no change
        if (accountEntity) {
          const account = getAccount(world, components, accountEntity);
          setKamiAccount(getKamiAccount(account, kamiAccount));
          setValidations({ ...validations, accountExists: true });
        } else {
          setKamiAccount(emptyAccountDetails());
          setValidations({ accountExists: false, operatorMatches: false, operatorHasGas: false });
        }
      }, [selectedAddress, accountFromWorldUpdate]);

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
              isTaken: operatorAddresses.has(burnerAddress),
            }}
            actions={{ createAccount }}
            utils={{
              setStep,
              queryAccountByName,
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
