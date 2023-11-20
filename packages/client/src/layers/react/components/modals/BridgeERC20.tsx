import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { useBalance, useContractRead } from 'wagmi';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

import { abi } from "abi/Farm20ProxySystem.json"
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings';

export function registerERC20BridgeModal() {
  registerUIComponent(
    'ERC20Bridge',
    {
      colStart: 28,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 74,
    },
    (layers) => {
      const {
        network: {
          systems,
          components: { Coin },
        },
      } = layers;

      return merge(Coin.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(layers);
          const { coin } = account;

          return {
            account,
            proxyAddy: systems["system.Farm20.Proxy"].address
          };
        })
      );
    },

    ({ account, proxyAddy }) => {
      const { account: kamiAccount } = useKamiAccount();
      const { selectedAddress, networks } = useNetworkSettings();

      const [isDepositState, setIsDepositState] = useState(true);
      const [amount, setAmount] = useState(0);
      const [statusText, setStatusText] = useState("");
      const [enableButton, setEnableButton] = useState(true);

      // get token balance of controlling account 
      const { data: erc20Addy } = useContractRead({
        address: proxyAddy as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy'
      });
      const { data: EOABal } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
        token: erc20Addy as `0x${string}`,
        watch: true
      });

      /////////////////
      // TRANSACTIONS

      const depositTx = () => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'MUSUDeposit',
          params: [amount],
          description: `Depositing ${amount} $MUSU`,
          execute: async () => {
            return api.ERC20.deposit(amount);
          },
        });
        return actionID;
      };

      const withdrawTx = () => {
        const network = networks.get(selectedAddress);
        const actions = network!.actions;
        const api = network!.api.player;

        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'MUSUWithdraw',
          params: [amount],
          description: `Withdrawing ${amount} $MUSU`,
          execute: async () => {
            // unimplemented
            // return api.ERC20.withdraw(amount);
          },
        });
        return actionID;
      };


      ///////////////
      // DISPLAY LOGIC

      const chooseTx = () => {
        if (isDepositState) {
          return depositTx();
        } else {
          return withdrawTx();
        }
      }

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          chooseTx();
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(event.target.value));
      };

      useEffect(() => {
        if (amount == 0) {
          setEnableButton(false);
          setStatusText("");
        }
        else if (isDepositState ? amount > Number(EOABal?.formatted) : amount > Number(account.coin ?? 0)) {
          setEnableButton(false);
          setStatusText("Insufficient Balance");
        }
        else if (!Number.isInteger(amount)) {
          setEnableButton(false);
          setStatusText("Invalid amount (whole numbers only)");
        }
        else {
          setEnableButton(true);
          setStatusText("");
        }
      }, [amount, isDepositState, EOABal, account.coin]);


      ///////////////
      // COMPONENTS

      const TxButton = () => {
        const text = isDepositState ? 'Deposit' : 'Withdraw';
        return (
          <ActionButton id='button-deposit' onClick={chooseTx} size='large' text={text} disabled={!enableButton} />
        )
      };

      const StateBox = (fundState: boolean) => {
        const text = fundState ? "Wallet" : "Game";
        const balance = fundState ? Math.floor(Number(EOABal?.formatted)) : Number(account.coin ?? 0);
        const color = (fundState == isDepositState) ? "grey" : "white";
        const textColor = (fundState == isDepositState) ? "white" : "black";
        return (
          <BoxButton style={{ backgroundColor: color }} onClick={() => setIsDepositState(fundState)}>
            <Description style={{ color: textColor }}> {balance} $MUSU </Description>
            <SubDescription style={{ color: textColor }}> {text} </SubDescription>
          </BoxButton>
        );
      };

      return (
        <ModalWrapperFull
          divName='bridgeERC20'
          id='bridgeERC20'
          canExit
          overlay
        >
          <Header>Bridge $MUSU</Header>
          <Grid>
            <div style={{ width: '100%', gridRow: 1, gridColumn: 1 }}>
              {StateBox(true)}
            </div>
            <div style={{ width: '100%', gridRow: 1, gridColumn: 2 }}>
              {StateBox(false)}
            </div>
            <Description style={{ gridRow: 2, gridColumnStart: 1, gridColumnEnd: 3 }}>
              Bridge $MUSU between your wallet (ERC20) and the game world.
            </Description>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gridRow: 4, gridColumnStart: 1, gridColumnEnd: 3 }}>
              <Input
                style={{ pointerEvents: 'auto' }}
                type='number'
                step='1'
                onKeyDown={(e) => catchKeys(e)}
                placeholder='0'
                onChange={(e) => handleChange(e)}
              ></Input>
              <SubText>{statusText}</SubText>
            </div>
            <div style={{ gridRow: 5, gridColumnStart: 1, gridColumnEnd: 3 }}>
              {TxButton()}
            </div>
          </Grid>
        </ModalWrapperFull>
      );
    }
  );
}

const BoxButton = styled.button`
  display: flex;
  flex-direction: column;
  width: 100%;

  background-color: #FFF;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;

  pointerEvents: 'auto';
`;

const Header = styled.p`
  color: black;
  padding: 1.5vw;
  
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  justify-items: center;
  justify-content: space-around;
  align-items: center;
  grid-column-gap: 6px;
  grid-row-gap: 6px;
  max-height: 80%;
  padding: 32px;
`;

const Description = styled.p`
  font-size: 14px;
  color: black;
  text-align: center;
  padding: 4px;
  font-family: Pixel;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;

  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 32px;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 32px;

  &:focus {
    outline: none;
  }
`;

const SubDescription = styled.p`
  font-size: 12px;
  color: grey;
  text-align: center;
  padding: 4px;
  font-family: Pixel;
  width: 100%;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #FF785B;
  text-align: center;
  padding: 4px;
  font-family: Pixel;
  
  cursor: pointer;
  border-width: 0px;
  background-color: #ffffff;
`;
