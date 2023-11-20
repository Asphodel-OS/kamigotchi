import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import { IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import crypto from "crypto";

import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';

import { defaultChain } from 'constants/chains';
import { CopyButton } from 'layers/react/components/library/CopyButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { AccountDetails, emptyAccountDetails, useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { playScribble } from 'utils/sounds';
import { ActionButton } from '../library/ActionButton';


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
      const {
        network: {
          world,
          components: {
            IsAccount,
            Name,
            OperatorAddress,
            OwnerAddress,
          },
          actions
        },
      } = layers;

      // TODO: replace this with getAccount shape
      const getAccountDetails = (index: EntityIndex): AccountDetails => {
        if (!index) return emptyAccountDetails();
        return {
          id: world.entities[index],
          index: index,
          ownerAddress: getComponentValue(OwnerAddress, index)?.value as string,
          operatorAddress: getComponentValue(OperatorAddress, index)?.value as string,
          name: getComponentValue(Name, index)?.value as string,
        };
      }

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
        OwnerAddress.update$,
      ).pipe(
        map(() => {
          const { selectedAddress } = useNetworkSettings.getState();
          const accountIndexUpdatedByWorld = getAccountIndexFromOwner(selectedAddress);
          const accountDetailsFromWorld = getAccountDetails(accountIndexUpdatedByWorld);
          const operatorAddresses = new Set(OperatorAddress.values.value.values());
          return {
            actions,
            world,
            accountDetailsFromWorld,
            operatorAddresses,
            getAccountIndexFromOwner,
            getAccountDetails,
          };
        })
      );
    },

    ({
      actions,
      world,
      accountDetailsFromWorld,
      operatorAddresses,
      getAccountIndexFromOwner,
      getAccountDetails,
    }) => {
      const { chain } = useNetwork();
      const { isConnected } = useAccount();
      const { details: accountDetails, setDetails: setAccountDetails } = useKamiAccount();
      const { burner, selectedAddress, networks } = useNetworkSettings();
      const { toggleButtons, toggleModals, toggleFixtures } = useComponentSettings();
      const [isVisible, setIsVisible] = useState(false);
      const [step, setStep] = useState(0);
      const [name, setName] = useState('');
      const [food, setFood] = useState('');

      // set visibility of this validator
      // we only want to prompt when an EOA is Connected to the correct network
      // and the connected burner address is the same as the current one in local storage 
      useEffect(() => {
        const burnersMatch = burner.connected.address === burner.detected.address;
        const networksMatch = chain?.id === defaultChain.id;
        setIsVisible(
          isConnected
          && networksMatch
          && burnersMatch
          && !accountDetails.id
        );
      }, [accountDetails, burner, isConnected]);

      // track the account details in store for easy access
      // expose/hide components accordingly
      useEffect(() => {
        const accountIndex = getAccountIndexFromOwner(selectedAddress);
        const accountDetails = getAccountDetails(accountIndex);
        if (!accountDetails.id) {
          toggleButtons(false);
          toggleFixtures(false);
          toggleModals(false);
        }

        setAccountDetails(accountDetails);
      }, [selectedAddress, isConnected, accountDetailsFromWorld, networks]);

      // catch clicks on modal, prevents duplicate Phaser3 triggers
      const handleClicks = (event: any) => {
        event.stopPropagation();
      };
      const element = document.getElementById('account-registrar');
      element?.addEventListener('mousedown', handleClicks);


      /////////////////
      // ACTIONS

      const copyBurnerAddress = () => {
        navigator.clipboard.writeText(burner.connected.address);
        // console.log(burner.connected);
      }

      const copyBurnerPrivateKey = () => {
        navigator.clipboard.writeText(burner.detected.key);
        // console.log(burner.detectedPrivateKey);
      }

      const handleAccountCreation = async (username: string, food: string) => {
        playScribble();
        toggleFixtures(true);
        try {
          const createAccountActionID = createAccount(username, food);
          await waitForActionCompletion(
            actions?.Action!,
            world.entityToIndex.get(createAccountActionID) as EntityIndex
          );
        } catch (e) {
          console.log('ERROR CREATING ACCOUNT:', e);
        }
      }


      const createAccount = (username: string, food: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;


        console.log('CREATING ACCOUNT FOR:', selectedAddress);
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'AccountCreate',
          params: [burner.connected, username, food],
          description: `Creating Account for ${username}`,
          execute: async () => {
            return api.account.register(burner.connected.address, username, food);
          },
        });
        return actionID;
        // const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        // return waitForActionCompletion(actions?.Action, actionIndex);
      }

      const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
      };

      const handleChangeFood = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFood(event.target.value);
      };


      /////////////////
      // VISUAL COMPONENTS

      const OperatorDisplay = () => {
        const address = burner.connected.address;
        const addrPrefix = address.slice(0, 6);
        const addrSuffix = address.slice(-4);
        const addressTaken = operatorAddresses.has(address);

        let color;
        let infoText;
        if (addressTaken) {
          color = '#b22';
          infoText = [
            'This burner address is taken by another account.',
            '',
            'But the odds of someone generating the same address are 1 in 10^48.. fascinating',
            '',
            'You can take a look at localstorage.',
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
            <Description>Operator: {`${addrPrefix}...${addrSuffix}`}</Description>
            <Tooltip text={infoText}>
              <IconButton size='small'>
                <InfoIcon fontSize='small' style={{ color }} />
              </IconButton>
            </Tooltip>
            <Tooltip text={['copy address']}>
              <CopyButton onClick={() => copyBurnerAddress()}></CopyButton>
            </Tooltip>
            <Tooltip text={['copy private key']}>
              <CopyButton onClick={() => copyBurnerPrivateKey()}></CopyButton>
            </Tooltip>
          </AddressRow>
        );
      }

      const OwnerDisplay = () => {
        const addrPrefix = selectedAddress.slice(0, 6);
        const addrSuffix = selectedAddress.slice(-4);

        return (
          <AddressRow>
            <Description>Owner: {`${addrPrefix}...${addrSuffix}`}</Description>
          </ AddressRow>
        );
      }

      const NextButton = () => (
        <ActionButton
          id='next'
          text='Next'
          onClick={() => setStep(step + 1)}
        />
      );

      const BackButton = () => (
        <ActionButton
          id='back'
          text='Back'
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        />
      );


      const Step0 = () => {
        return (
          <>
            <br />
            <Description>Lorem Ipsum Yo</Description>
            <br />
            <NextButton />
          </>
        );
      }
      const Step1 = () => {
        return (
          <>
            <br />
            <Description>Lorem Ipsum Yo</Description>
            <br />
            <Row>
              <BackButton />
              <NextButton />
            </Row>
          </>
        );
      }

      const Step2 = () => {
        return (
          <>
            <Header>Connected Addresses</Header>
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
      }

      const Step3 = () => {
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
              <ActionButton
                id='submit'
                text='Submit'
                disabled={name === '' || food === ''}
                onClick={() => handleAccountCreation(name, food)}
              />
            </Row>
          </>
        );
      }

      const GetSteps = () => {
        return [Step0(), Step1(), Step2(), Step3()];
      }


      /////////////////
      // DISPLAY

      return (
        <Wrapper id='account-registrar' style={{ display: isVisible ? 'block' : 'none' }}>
          <Content style={{ pointerEvents: 'auto' }}>
            <Title>Register Your Account</Title>
            <Subtitle>(no registered account for connected address)</Subtitle>
            {GetSteps()[step]}
          </Content>
        </Wrapper>
      );
    }
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Wrapper = styled.div`
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const Content = styled.div`
  background-color: white;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 10px;
  width: 99%;

  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const AddressRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const Title = styled.p`
  margin: 25px 0px 0px 0px;

  padding: 5px 0px;
  color: #333;
  font-family: Pixel;
  font-size: 24px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  text-align: center;
  font-family: Pixel;
  padding: 5px;
`;

const Header = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 20px 0px 10px 0px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px;
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