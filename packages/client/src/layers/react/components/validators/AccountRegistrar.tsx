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

import { getAccountByName } from 'layers/network/shapes/Account';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { CopyButton } from 'layers/react/components/library/CopyButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { ValidatorWrapper } from 'layers/react/components/library/ValidatorWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import {
  Account,
  emptyAccountDetails,
  useAccount,
  useNetwork,
  useVisibility,
} from 'layers/react/store';
import { playScribble } from 'utils/sounds';

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

// TODO: check for whether an account with the burner address already exists
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
      const { IsAccount, AccountIndex, Name, OperatorAddress, OwnerAddress } = components;

      // TODO?: replace this with getAccount shape
      const getAccountDetails = (entityIndex: EntityIndex): Account => {
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

      const getAccountIndexFromOwner = (ownerAddress: string): EntityIndex => {
        const accountIndex = Array.from(
          runQuery([
            Has(IsAccount),
            HasValue(OwnerAddress, {
              value: ownerAddress,
            }),
          ])
        )[0];
        return accountIndex;
      };

      return merge(
        IsAccount.update$,
        Name.update$,
        OperatorAddress.update$,
        OwnerAddress.update$
      ).pipe(
        map(() => {
          const { selectedAddress } = useNetwork.getState();
          const accountIndexUpdatedByWorld = getAccountIndexFromOwner(selectedAddress);
          const kamiAccountFromWorldUpdate = getAccountDetails(accountIndexUpdatedByWorld);
          const operatorAddresses = new Set(OperatorAddress.values.value.values());
          return {
            data: {
              kamiAccountFromWorldUpdate,
              operatorAddresses,
            },
            functions: {
              getAccountIndexFromOwner,
              getAccountDetails,
            },
            network,
          };
        })
      );
    },

    ({ data, functions, network }) => {
      const { kamiAccountFromWorldUpdate, operatorAddresses } = data;
      const { getAccountDetails, getAccountIndexFromOwner } = functions;
      const { actions, components, world } = network;

      const {
        burnerAddress,
        selectedAddress,
        apis,
        validations: networkValidations,
      } = useNetwork();
      const { toggleButtons, toggleModals, toggleFixtures } = useVisibility();
      const { validators, setValidators } = useVisibility();
      const { setAccount, validations, setValidations } = useAccount();

      const [isVisible, setIsVisible] = useState(false);
      const [accountExists, setAccountExists] = useState(false);
      const [nameTaken, setNameTaken] = useState(false);
      const [step, setStep] = useState(0);
      const [name, setName] = useState('');
      const [food, setFood] = useState('');

      // run the primary check(s) for this validator
      // track in store for easy access and update any local state variables accordingly
      useEffect(() => {
        const accountIndex = getAccountIndexFromOwner(selectedAddress);
        const accountExists = !!accountIndex; // locally overloaded variable yes
        setValidations({ ...validations, accountExists });
        setAccountExists(accountExists);
        if (accountExists) {
          const kamiAccount = getAccountDetails(accountIndex);
          setAccount(kamiAccount);
        }
      }, [selectedAddress, kamiAccountFromWorldUpdate]);

      // determine visibility based on above/prev checks
      useEffect(() => {
        setIsVisible(
          networkValidations.authenticated && networkValidations.chainMatches && !accountExists
        );
      }, [networkValidations, selectedAddress, accountExists]);

      // adjust actual visibility of windows based on above determination
      useEffect(() => {
        if (isVisible) {
          toggleModals(false);
          toggleButtons(false);
        }
        toggleFixtures(!isVisible && !validators.walletConnector);
        if (isVisible != validators.accountRegistrar) {
          const { validators } = useVisibility.getState();
          setValidators({ ...validators, accountRegistrar: isVisible });
        }
      }, [isVisible, validators.walletConnector]);

      // validation for username input
      useEffect(() => {
        const account = getAccountByName(world, components, name);
        setNameTaken(!!account.id);
      }, [name]);

      /////////////////
      // ACTIONS

      const copyBurnerAddress = () => {
        navigator.clipboard.writeText(burnerAddress);
      };

      const copyBurnerPrivateKey = () => {
        // navigator.clipboard.writeText(burner.detected.key);
      };

      const handleAccountCreation = async (username: string, food: string) => {
        playScribble();
        toggleFixtures(true);
        try {
          const actionID = createAccount(username, food);
          if (!actionID) throw new Error('Account creation failed');

          await waitForActionCompletion(
            actions.Action,
            world.entityToIndex.get(actionID) as EntityIndex
          );
        } catch (e) {
          console.log('ERROR CREATING ACCOUNT:', e);
        }
      };

      const createAccount = (username: string, food: string) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);
        console.log(`CREATING ACCOUNT (${username}): ${selectedAddress}`);

        const connectedBurner = burnerAddress;
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'AccountCreate',
          params: [connectedBurner, username, food],
          description: `Creating Account for ${username}`,
          execute: async () => {
            return api.account.register(connectedBurner, username, food);
          },
        });
        return actionID;
      };

      const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      const handleChangeFood = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFood(event.target.value);
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
            <Tooltip text={['copy private key']}>
              <CopyButton onClick={() => copyBurnerPrivateKey()} />
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
        <ActionButton id='next' text='Next' onClick={() => setStep(step + 1)} size='vending' />
      );

      const BackButton = () => (
        <ActionButton
          id='back'
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

        const NextButton = () => {
          let button = (
            <ActionButton
              id='next'
              text='Next'
              onClick={() => setStep(step + 1)}
              disabled={addressTaken || name === '' || nameTaken}
              size='vending'
            />
          );

          let tooltip: string[] = [];
          if (addressTaken) tooltip = ['Unfortunately, that Avatar is already taken.'];
          else if (nameTaken) tooltip = ['Unfortunately, that Name is already taken.'];
          else if (name === '')
            tooltip = [`It's dangerous to go alone.`, `One needs to take an Avatar.`];
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
              placeholder='username'
              style={{ pointerEvents: 'auto' }}
            />
            <Row>
              <BackButton />
              <NextButton />
            </Row>
          </>
        );
      };

      const FoodStep = () => {
        return (
          <>
            <br />
            <Description>And your favorite food?</Description>
            <br />
            <Input
              type='string'
              value={food}
              placeholder='stawberi'
              onChange={(e) => handleChangeFood(e)}
              style={{ pointerEvents: 'auto' }}
            />
            <Row>
              <BackButton />
              <Tooltip text={food === '' ? ["You shouldn't skip lunch.."] : []}>
                <ActionButton
                  id='submit'
                  text='Submit'
                  disabled={food === ''}
                  onClick={() => handleAccountCreation(name, food)}
                  size='vending'
                />
              </Tooltip>
            </Row>
          </>
        );
      };

      const GetSteps = () => {
        return [IntroStep1(), IntroStep2(), UsernameStep(), FoodStep()];
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
