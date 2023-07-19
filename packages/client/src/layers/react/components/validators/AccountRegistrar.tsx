import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';
import { IconButton, TextField } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';

import { defaultChainConfig } from 'constants/chains';
import { CopyButton } from 'layers/react/components/library/CopyButton';
import { SingleInputTextForm } from 'layers/react/components/library/SingleInputTextForm';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import {
  AccountDetails,
  emptyAccountDetails,
  useKamiAccount,
} from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings';

import successSound from 'assets/sound/fx/bubble_success.mp3';
import scribbleSound from 'assets/sound/fx/scribbling.mp3';
import 'layers/react/styles/font.css';


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
      accountDetailsFromWorld,
      operatorAddresses,
      getAccountIndexFromOwner,
      getAccountDetails,
    }) => {
      const { chain } = useNetwork();
      const { isConnected } = useAccount();
      const { details: accountDetails, setDetails: setAccountDetails } = useKamiAccount();
      const { burnerInfo, selectedAddress, networks } = useNetworkSettings();
      const { sound: { volume } } = dataStore();
      const { visibleModals, setVisibleModals } = dataStore();
      const { toggleVisibleButtons, toggleVisibleModals } = dataStore();
      const [isVisible, setIsVisible] = useState(false);

      // set visibility of this validator
      useEffect(() => {
        const burnersMatch = burnerInfo.connected === burnerInfo.detected;
        const networksMatch = chain?.id === defaultChainConfig.id;
        setIsVisible(isConnected && networksMatch && burnersMatch && !accountDetails.id);
      }, [accountDetails, burnerInfo, isConnected]);

      // track the account details in store for easy access
      // expose/hide components accordingly
      useEffect(() => {
        const accountIndex = getAccountIndexFromOwner(selectedAddress);
        const accountDetails = getAccountDetails(accountIndex);
        setAccountDetails(accountDetails);

        if (accountDetails.id) {
          toggleVisibleButtons(true);
        } else {
          toggleVisibleButtons(false);
          toggleVisibleModals(false);
        }
      }, [selectedAddress, isConnected, accountDetailsFromWorld]);


      /////////////////
      // ACTIONS

      const playSound = (sound: any) => {
        const soundFx = new Audio(sound);
        soundFx.volume = volume;
        soundFx.play();
      }

      const copyBurnerAddress = () => {
        navigator.clipboard.writeText(burnerInfo.connected);
        console.log(burnerInfo.connected);
      }

      const copyBurnerPrivateKey = () => {
        navigator.clipboard.writeText(burnerInfo.detectedPrivateKey);
        console.log(burnerInfo.detectedPrivateKey);
      }

      const openFundModal = () => {
        setVisibleModals({
          ...visibleModals,
          operatorFund: true,
        });
      };

      const createAccountWithFx = async (username: string) => {
        playSound(scribbleSound);
        await createAccount(username);
        playSound(successSound);
        openFundModal();
      }

      const createAccount = async (username: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;

        console.log('CREATING ACCOUNT FOR:', selectedAddress);
        const actionID = `Creating Account: ${username}` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.register(burnerInfo.connected, username);
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions.Action, actionIndex);
      }


      /////////////////
      // VISUAL COMPONENTS

      const OperatorDisplay = () => {
        const address = burnerInfo.connected;
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
            'But the odds of someone generating the same address are 1 in 1,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000.. fascinating',
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


      /////////////////
      // DISPLAY

      return (
        <ModalWrapper id='accountRegistration' style={{ display: isVisible ? 'block' : 'none' }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Register Your Account</Title>
            <Subtitle>(no registered account for connected address)</Subtitle>
            <Header>Connected Addresses</Header>
            {OwnerDisplay()}
            {OperatorDisplay()}
            <SingleInputTextForm
              id={`username`}
              label='username'
              placeholder='BPD_GOD'
              hasButton={true}
              onSubmit={(v: string) => createAccountWithFx(v)}
            />
          </ModalContent>
        </ModalWrapper>
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

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  animation: ${fadeIn} 1.3s ease-in-out;
`;

const ModalContent = styled.div`
  background-color: white;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 10px;
  width: 99%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

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

const Title = styled.p`
  margin: 10px 0px 0px 0px;

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
