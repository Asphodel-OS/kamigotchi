import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled, { keyframes } from 'styled-components';
import { useAccount, useNetwork } from 'wagmi';
import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import { waitForActionCompletion } from '@latticexyz/std-client';

import { defaultChainConfig } from 'constants/chains';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { useNetworkSettings } from 'layers/react/store/networkSettings'
import {
  AccountDetails,
  emptyAccountDetails,
  useKamiAccount,
} from 'layers/react/store/kamiAccount';
import { SingleInputTextForm } from 'layers/react/components/library/SingleInputTextForm';

import scribbleSound from 'assets/sound/fx/scribbling.mp3';
import successSound from 'assets/sound/fx/bubble_success.mp3';
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
          return {
            actions,
            accountDetailsFromWorld,
            getAccountIndexFromOwner,
            getAccountDetails,
          };
        })
      );
    },

    ({
      actions,
      accountDetailsFromWorld,
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

      const createAccountWithFx = async (username: string) => {
        playSound(scribbleSound);
        await createAccount(username);
        playSound(successSound);
        openFundModal();
      }

      const openFundModal = () => {
        setVisibleModals({
          ...visibleModals,
          operatorFund: true,
        });
      };

      const createAccount = async (username: string) => {
        const network = networks.get(selectedAddress);
        const world = network!.world;
        const api = network!.api.player;

        console.log('CREATING ACCOUNT FOR:', selectedAddress);
        const actionID = `Creating Account` as EntityID;
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
      // DISPLAY

      return (
        <ModalWrapper id='accountRegistration' style={{ display: isVisible ? 'block' : 'none' }}>
          <ModalContent style={{ pointerEvents: 'auto' }}>
            <Title>Register Your Account</Title>
            <Description>(no registered account for connected address)</Description>
            <Header>Detected Addresses</Header>
            <Description>Owner: {selectedAddress}</Description>
            <Description>Operator: {burnerInfo.connected}</Description>
            <SingleInputTextForm
              id={`username`}
              label='username'
              placeholder='username'
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
  display: grid;
  justify-content: center;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Title = styled.p`
  font-size: 18px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;

const Header = styled.p`
  font-size: 14px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 15px 0px 5px 0px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: center;
  font-family: Pixel;
  padding: 5px 0px;
`;
