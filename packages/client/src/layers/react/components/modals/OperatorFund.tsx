/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { utils } from 'ethers';
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

export function registerOperatorFund() {
  registerUIComponent(
    'OperatorFund',
    {
      colStart: 28,
      colEnd: 70,
      rowStart: 34,
      rowEnd: 70,
    },
    (layers) => {
      const {
        network: {
          network: { connectedAddress },
          components: {
            IsAccount,
            OperatorAddress
          },
        },
      } = layers;

      return merge(OperatorAddress.update$, IsAccount.update$).pipe(
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

          return {
            layers
          };
        })
      );
    },

    ({ layers }) => {
      const {
        network: {
          api: {
            player: { account }
          },
          actions,
        },
      } = layers;
      const { details: accountDetails } = useKamiAccount();
      const { visibleModals, setVisibleModals } = dataStore();
      const { selectedAddress, networks } = useNetworkSettings();

      const [FundAmount, setFundAmount] = useState(0);
      const [RefundAmount, setRefundAmount] = useState(0);

      const [FundGasWarn, setFundGasWarn] = useState("");
      const [RefundGasWarn, setRefundGasWarn] = useState("");


      /////////////////
      // BALANCES

      const { data: OwnerBal } = useBalance({
        address: accountDetails.ownerAddress as `0x${string}`,
        watch: true
      });

      const { data: OperatorBal } = useBalance({
        address: accountDetails.operatorAddress as `0x${string}`,
        watch: true
      });


      /////////////////
      // ACTIONS

      const fundTx = async () => {
        const network = networks.get(selectedAddress);
        const account = network!.api.player.account;

        const actionID = `Funding Operator` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return account.fund(FundAmount.toString());
          },
        });
        return actionID;
      };

      const refundTx = async () => {
        const actionID = `Refunding Owner` as EntityID;
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return account.refund(RefundAmount.toString());
          },
        });
        return actionID;
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, operatorFund: false });
      }, [setVisibleModals, visibleModals]);

      ///////////////
      // DISPLAY

      const DepositButton = (
        <ActionButton id='button-deposit' onClick={fundTx} size='medium' text='↵' />
      );

      const WithdrawButton = (
        <ActionButton id='button-deposit' onClick={refundTx} size='medium' text='↵' />
      );

      const catchKeysFund = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          fundTx();
        }
      };

      const catchKeysRefund = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          refundTx();
        }
      };

      const setMaxFund = () => {
        setFundAmount(Number(OwnerBal?.formatted));
      };

      const setMaxRefund = () => {
        setRefundAmount(Number(OperatorBal?.formatted));
      };

      const handleChangeDep = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFundAmount(Number(event.target.value));
      };

      const handleChangeWit = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRefundAmount(Number(event.target.value));
      };

      useEffect(() => {
        if (FundAmount > Number(OwnerBal?.formatted)) setFundGasWarn("Insufficient balance");
        else if (FundAmount == Number(OwnerBal?.formatted)) setFundGasWarn("Leave a little for gas!");
        else setFundGasWarn("");
      }, [FundAmount, OwnerBal]);

      useEffect(() => {
        if (RefundAmount > Number(OperatorBal?.formatted)) setRefundGasWarn("Insufficient balance");
        else if (RefundAmount == Number(OperatorBal?.formatted)) setRefundGasWarn("Leave a little for gas!");
        else setRefundGasWarn("");
      }, [RefundAmount, OperatorBal]);

      return (
        <ModalWrapperFull divName='operatorFund' id='operatorFund'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Header>Fund Operator</Header>
          <Grid>
            <Description style={{ gridRow: 1, gridColumn: 1 }}>
              Fund Operator
            </Description>
            <div style={{ display: "grid", justifyItems: "end", gridRow: 1, gridColumn: 2 }}>
              <MaxText style={{ gridRow: 1 }} onClick={setMaxFund}>
                Owner: {Number(OwnerBal?.formatted).toFixed(4)} ETH
              </MaxText>
              <OutlineBox>
                <Input
                  style={{ gridRow: 2, pointerEvents: 'auto' }}
                  type='number'
                  onKeyDown={(e) => catchKeysFund(e)}
                  placeholder='0'
                  value={FundAmount}
                  onChange={(e) => handleChangeDep(e)}
                ></Input>
                {DepositButton}
              </OutlineBox>
              <WarnText style={{ gridRow: 3 }}>{FundGasWarn}</WarnText>
            </div>
            <Description style={{ gridRow: 2, gridColumn: 1 }}>
              Withdraw
            </Description>
            <div style={{ display: "grid", justifyItems: "end", gridRow: 2, gridColumn: 2 }}>
              <MaxText style={{ gridRow: 1 }} onClick={setMaxRefund}>
                Operator: {Number(OperatorBal?.formatted).toFixed(4)} ETH
              </MaxText>
              <OutlineBox>
                <Input
                  style={{ gridRow: 2, pointerEvents: 'auto' }}
                  type='number'
                  onKeyDown={(e) => catchKeysRefund(e)}
                  placeholder='0'
                  value={RefundAmount}
                  onChange={(e) => handleChangeWit(e)}
                ></Input>
                {WithdrawButton}
              </OutlineBox>
              <WarnText style={{ gridRow: 3 }}>{RefundGasWarn}</WarnText>
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
  align-items: center;
  grid-column-gap: 12px;
  grid-row-gap: 24px;
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

const WarnText = styled.text`
  font-size: 12px;
  color: #FF785B;
  text-align: center;
  padding: 4px;
  font-family: Pixel;
  
  cursor: pointer;
  border-width: 0px;
  background-color: #ffffff;
`;
