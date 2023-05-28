/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, BigNumberish, utils } from 'ethers';
import React, { useCallback, useEffect } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';
import { useAccount, useBalance, useContractRead } from 'wagmi';

import { Account, getAccount } from '../shapes/Account';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionButton } from 'layers/react/components/library/ActionButton';

import { abi } from "../../../../../abi/ERC20ProxySystem.json"

export function registerERC20BridgeModal() {
  registerUIComponent(
    'ERC20Bridge',
    {
      colStart: 33,
      colEnd: 65,
      rowStart: 37,
      rowEnd: 76,
    },
    (layers) => {
      const {
        network: {
          systems,
          network: { connectedAddress },
          components: {
            Coin,
            IsAccount,
            OperatorAddress,
          },
        },
      } = layers;

      return merge(Coin.update$).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountEntityIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: connectedAddress.get(),
              }),
            ])
          )[0];

          const account =
            accountEntityIndex !== undefined
              ? getAccount(layers, accountEntityIndex)
              : ({} as Account);

          const { coin } = account;

          return {
            CoinBal: coin,
            proxyAddy: systems["system.ERC20.Proxy"].address
          };
        })
      );
    },

    ({ CoinBal, proxyAddy }) => {
      const { details: accountDetails } = useKamiAccount();
      const { visibleModals, setVisibleModals, networks } = dataStore();
      // get token balance of controlling account 
      const { data: erc20Addy } = useContractRead({
        address: proxyAddy as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });
      const { data: EOABalance } = useBalance({
        address: accountDetails.ownerAddress as `0x${string}`,
        token: erc20Addy as `0x${string}`,
        formatUnits: "wei",
        watch: true
      });

      /////////////////
      // ACTIONS

      // TODO: Amount is hardcoded to 1 – to add input boxes
      const amount = 1;

      // TODO: get ERC20 balance - blocked by wallet code
      const depositTx = () => {
        const {
          actions,
          api: { player: { ERC20 } }
        } = networks.get(accountDetails.ownerAddress);

        const actionID = `Depositing $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return ERC20.deposit(amount);
          },
        });
        return actionID;
      };

      const withdrawTx = () => {
        const {
          actions,
          api: { player: { ERC20 } }
        } = networks.get(accountDetails.ownerAddress);


        const actionID = `Withdrawing $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return ERC20.withdraw(amount);
          },
        });
        return actionID;
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, bridgeERC20: false });
      }, [setVisibleModals, visibleModals]);

      ///////////////
      // DISPLAY

      const DepositButton = (
        <ActionButton id='button-deposit' onClick={depositTx} size='large' text='Deposit' />
      );

      const WithdrawButton = (
        <ActionButton id='button-deposit' onClick={withdrawTx} size='large' text='Withdraw' />
      );

      return (
        <ModalWrapperFull divName='ERC20Bridge' id='ERC20Bridge'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Description>
            <Header style={{ color: 'black' }}>$KAMI Bridge</Header>
            <br />
            Bridge $KAMI tokens to and from ERC20. You have {CoinBal} $KAMI in game, and {EOABalance?.formatted} $KAMI tokens
          </Description>
          {WithdrawButton}
          {DepositButton}
        </ModalWrapperFull>
      );
    }
  );
}

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const CenterBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

const Description = styled.p`
  font-size: 20px;
  color: #333;
  text-align: center;
  padding: 10px;
  font-family: Pixel;
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;
