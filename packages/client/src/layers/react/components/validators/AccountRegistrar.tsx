import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import InfoIcon from '@mui/icons-material/Info';
import { IconButton } from '@mui/material';
import { waitForActionCompletion } from 'layers/network/utils';
import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import {
  Account,
  getAccount,
  getAccountEntityIndexByName,
  getAccountEntityIndexByOwner,
} from 'layers/network/shapes/Account';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { CopyButton } from 'layers/react/components/library/CopyButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import {
  Account as KamiAccount,
  emptyAccountDetails,
  useAccount,
  useNetwork,
  useVisibility,
} from 'layers/react/store';
import { playSignup } from 'utils/sounds';

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
      colStart: 20,
      colEnd: 80,
      rowStart: 30,
      rowEnd: 60,
    },
    (layers) => {
      const { network } = layers;
      const { world, components } = network;
      const { IsAccount, AccountIndex, FarcasterIndex, Name, OperatorAddress, OwnerAddress } =
        components;

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
          runQuery([Has(IsAccount), HasValue(OwnerAddress, { value: ownerAddress })])
        )[0];
        return accountIndex;
      };

      return merge(
        IsAccount.update$,
        AccountIndex.update$,
        FarcasterIndex.update$,
        Name.update$,
        OperatorAddress.update$,
        OwnerAddress.update$
      ).pipe(
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
            functions: {
              getKamiAccount,
            },
            network,
          };
        })
      );
    },

    ({ data, functions, network }) => {
      const { accountFromWorldUpdate, operatorAddresses } = data;
      const { getKamiAccount } = functions;
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
      const [name, setName] = useState('');

      // update the Kami Account and validation based on changes to the
      // connected address and detected account in the world
      useEffect(() => {
        const accountEntityIndex = getAccountEntityIndexByOwner(components, selectedAddress);
        if (!!accountEntityIndex == validations.accountExists) return; // no change
        if (!!accountEntityIndex) {
          const account = getAccount(world, components, accountEntityIndex);
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
      }, [networkValidations, validations.accountExists]);

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
      // INTERACTION

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          handleAccountCreation(name);
        }
      };

      const copyBurnerAddress = () => {
        navigator.clipboard.writeText(burnerAddress);
      };

      const handleAccountCreation = async (username: string) => {
        playSignup();
        toggleFixtures(true);
        try {
          const actionID = createAccount(username);
          if (!actionID) throw new Error('Account creation failed');

          await waitForActionCompletion(
            actions.Action,
            world.entityToIndex.get(actionID) as EntityIndex
          );
        } catch (e) {
          console.log('ERROR CREATING ACCOUNT:', e);
        }
      };

      const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      /////////////////
      // INTERPRETATION

      const isNameTaken = () => {
        const account = getAccountEntityIndexByName(components, name);
        return !!account;
      };

      /////////////////
      // RENDERING

      const OperatorDisplay = () => {
        const address = burnerAddress;
        const addrPrefix = address.slice(0, 6);
        const addrSuffix = address.slice(-4);
        const addressTaken = operatorAddresses.has(address);

        let color;
        let infoText;
        if (addressTaken) {
          color = '#b22';
          infoText = [
            'This burner address references an Avatar already taken by another Account.',
            '',
            'But the odds of someone generating the same address are 1 in 10^48.',
            '',
            'Fascinating. You can take a look at localstorage..',
          ];
        } else {
          color = '#666';
          infoText = [
            'The private key to this address is generated and stored in the browser. It behaves like a session key and is used to approve in-game actions without the need for explicit signatures.',
            '',
            'It cannot make account level changes or migrate your assets in and out of the game.',
            '',
            'Copy the private key locally and do not share it. Consider it replaceable and only store modest sums on it at a time.',
          ];
        }

        return (
          <AddressRow>
            <Description>Avatar: {`${addrPrefix}...${addrSuffix}`}</Description>
            <Tooltip text={infoText}>
              <IconButton size='small'>
                <InfoIcon fontSize='small' style={{ color }} />
              </IconButton>
            </Tooltip>
            <Tooltip text={['copy address']}>
              <CopyButton onClick={() => copyBurnerAddress()} />
            </Tooltip>
          </AddressRow>
        );
      };

      const OwnerDisplay = () => {
        const addrPrefix = selectedAddress.slice(0, 6);
        const addrSuffix = selectedAddress.slice(-4);

        return (
          <AddressRow>
            <Description>Owner: {`${addrPrefix}...${addrSuffix}`}</Description>
          </AddressRow>
        );
      };

      const NextButton = () => (
        <ActionButton text='Next' onClick={() => setStep(step + 1)} size='vending' />
      );

      const BackButton = () => (
        <ActionButton
          text='Back'
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          size='vending'
        />
      );

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
              <BackButton />
              <NextButton />
            </Row>
          </>
        );
      };

      const UsernameStep = () => {
        const addressTaken = operatorAddresses.has(burnerAddress);

        const SubmitButton = () => {
          let button = (
            <ActionButton
              text='Submit'
              disabled={addressTaken || name === '' || isNameTaken() || /\s/.test(name)}
              onClick={() => handleAccountCreation(name)}
              size='vending'
            />
          );

          let tooltip: string[] = [];
          if (addressTaken) tooltip = ['That Avatar is already taken.'];
          else if (name === '') tooltip = [`Name cannot be empty.`];
          else if (isNameTaken()) tooltip = ['That name is already taken.'];
          else if (/\s/.test(name)) tooltip = [`Name cannot contain whitespace.`];
          if (tooltip.length > 0) button = <Tooltip text={tooltip}>{button}</Tooltip>;

          return button;
        };

        return (
          <>
            <Description>You will be assigned an avatar.</Description>
            <Description>Please give it a name.</Description>
            <br />
            {OwnerDisplay()}
            {OperatorDisplay()}
            <Input
              type='string'
              value={name}
              onChange={(e) => handleChangeName(e)}
              onKeyDown={(e) => catchKeys(e)}
              placeholder='username'
              style={{ pointerEvents: 'auto' }}
            />
            <Row>
              <BackButton />
              <SubmitButton />
            </Row>
          </>
        );
      };

      const GetSteps = () => {
        return [IntroStep1(), IntroStep2(), UsernameStep()];
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

const AddressRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding-top: 10px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 10px;
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
