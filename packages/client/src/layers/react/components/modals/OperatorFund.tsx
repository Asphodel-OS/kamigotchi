/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, BigNumberish, utils } from 'ethers';
import React, { useCallback, useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, EntityIndex, Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';
import { useAccount, useBalance, useContractRead } from 'wagmi';

import { Account, getAccount } from '../shapes/Account';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
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
      rowEnd: 68,
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
      const { visibleModals, setVisibleModals } = dataStore();
      const { selectedAddress, networks } = useNetworkSettings();

      const [depAmount, setDepAmount] = useState(0);
      const [witAmount, setWitAmount] = useState(0);
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

      // TODO: get ERC20 balance - blocked by wallet code
      const depositTx = () => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = `Depositing $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC20.deposit(depAmount);
          },
        });
        return actionID;
      };

      const withdrawTx = () => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = `Withdrawing $KAMI` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.ERC20.withdraw(witAmount);
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
        <ActionButton id='button-deposit' onClick={depositTx} size='medium' text='↵' />
      );

      const WithdrawButton = (
        <ActionButton id='button-deposit' onClick={withdrawTx} size='medium' text='↵' />
      );

      const catchKeysDep = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          depositTx();
        }
      };

      const catchKeysWit = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          withdrawTx();
        }
      };

      const setMaxDep = () => {
        setDepAmount(Number(EOABalance?.formatted));
      };

      const setMaxWit = () => {
        setWitAmount(Number(CoinBal));
      };

      const handleChangeDep = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDepAmount(Number(event.target.value));
      };

      const handleChangeWit = (event: React.ChangeEvent<HTMLInputElement>) => {
        setWitAmount(Number(event.target.value));
      };

      return (
        <ModalWrapperFull divName='bridgeERC20' id='bridgeERC20'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Header>Bridge $KAMI</Header>
          <Grid>
            <Description style={{ gridRow: 1, gridColumn: 1 }}>
              Withdraw
            </Description>
            <div style={{ display: "grid", justifyItems: "end", gridRow: 1, gridColumn: 2 }}>
              <MaxText style={{ gridRow: 1 }} onClick={setMaxWit}>
                Game: {Number(CoinBal)} $KAMI
              </MaxText>
              <OutlineBox>
                <Input
                  style={{ gridRow: 2, pointerEvents: 'auto' }}
                  type='number'
                  onKeyDown={(e) => catchKeysWit(e)}
                  placeholder='0'
                  value={witAmount}
                  onChange={(e) => handleChangeWit(e)}
                ></Input>
                {WithdrawButton}
              </OutlineBox>
            </div>
            <Description style={{ gridRow: 2, gridColumn: 1 }}>
              Deposit
            </Description>
            <div style={{ display: "grid", justifyItems: "end", gridRow: 2, gridColumn: 2 }}>
              <MaxText style={{ gridRow: 1 }} onClick={setMaxDep}>
                Wallet: {Number(EOABalance?.formatted)} $KAMI
              </MaxText>
              <OutlineBox>
                <Input
                  style={{ gridRow: 2, pointerEvents: 'auto' }}
                  type='number'
                  onKeyDown={(e) => catchKeysDep(e)}
                  placeholder='0'
                  value={depAmount}
                  onChange={(e) => handleChangeDep(e)}
                ></Input>
                {DepositButton}
              </OutlineBox>
            </div>
          </Grid>
        </ModalWrapperFull>
      );
    }
  );
}

const Header = styled.p`
  font-size: 24px;
  color: black;
  text-align: center;
  font-family: Pixel;
`;

const Grid = styled.div`
  display: grid;
  justify-items: start;
  align-items: end;
  grid-column-gap: 12px;
  grid-row-gap: 18px;
  max-height: 80%;
  padding: 32px;
`;

const Description = styled.p`
  font-size: 20px;
  color: black;
  text-align: center;
  padding: 10px;
  font-family: Pixel;
`;

const Input = styled.input`
  width: 100%;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 16px 6px 16px 16px;

  &:focus {
    outline: none;
  }
`;

const MaxText = styled.button`
  font-size: 12px;
  color: #666;
  text-align: center;
  padding: 4px;
  font-family: Pixel;
  
  cursor: pointer;
  border-width: 0px;
  background-color: #ffffff;

  &:hover {
    text-decoration: underline;
  }
`;

const OutlineBox = styled.div`
  display: flex;
  flex-direction: row;

  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  border-radius: 5px;
  color: black;
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
