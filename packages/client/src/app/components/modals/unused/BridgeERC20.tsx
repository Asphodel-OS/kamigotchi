import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { useBalance, useReadContract } from 'wagmi';

import { abi } from 'abi/Farm20ProxySystem.json';
import { ActionButton, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';

export function registerERC20BridgeModal() {
  registerUIComponent(
    'ERC20Bridge',
    {
      colStart: 28,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 74,
    },
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { actions, systems } = network;
          const account = getAccountFromBurner(network);
          return {
            actions,
            account,
            proxyAddy: systems['system.Farm20.Proxy'].address,
          };
        })
      ),

    ({ actions, account, proxyAddy }) => {
      const { account: kamiAccount } = useAccount();
      const { selectedAddress, apis } = useNetwork();

      const [isDepositState, setIsDepositState] = useState(true);
      const [amount, setAmount] = useState(0);
      const [statusText, setStatusText] = useState('');
      const [enableButton, setEnableButton] = useState(true);

      // get token balance of controlling account
      const { data: erc20Addy } = useReadContract({
        address: proxyAddy as `0x${string}`,
        abi: abi,
        functionName: 'getTokenAddy',
      });

      const { data: EOABal } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
        token: erc20Addy as `0x${string}`,
      });

      /////////////////
      // TRANSACTIONS

      const depositTx = () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        actions.add({
          action: 'MUSUDeposit',
          params: [amount],
          description: `Depositing ${amount} $MUSU`,
          execute: async () => {
            return api.ERC20.deposit(amount);
          },
        });
      };

      const withdrawTx = () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        actions.add({
          action: 'MUSUWithdraw',
          params: [amount],
          description: `Withdrawing ${amount} $MUSU`,
          execute: async () => {
            // unimplemented
            // return api.ERC20.withdraw(amount);
          },
        });
      };

      ///////////////
      // DISPLAY LOGIC

      const chooseTx = () => {
        if (isDepositState) {
          return depositTx();
        } else {
          return withdrawTx();
        }
      };

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
          setStatusText('');
        } else if (
          isDepositState ? amount > Number(EOABal?.formatted) : amount > Number(account.coin ?? 0)
        ) {
          setEnableButton(false);
          setStatusText('Insufficient Balance');
        } else if (!Number.isInteger(amount)) {
          setEnableButton(false);
          setStatusText('Invalid amount (whole numbers only)');
        } else {
          setEnableButton(true);
          setStatusText('');
        }
      }, [amount, isDepositState, EOABal, account.coin]);

      ///////////////
      // COMPONENTS

      const TxButton = () => {
        const text = isDepositState ? 'Deposit' : 'Withdraw';
        return (
          <ActionButton onClick={chooseTx} size='large' text={text} disabled={!enableButton} />
        );
      };

      const StateBox = (fundState: boolean) => {
        const text = fundState ? 'Wallet' : 'Game';
        const balance = fundState
          ? Math.floor(Number(EOABal?.formatted))
          : Number(account.coin ?? 0);
        const color = fundState == isDepositState ? 'grey' : 'white';
        const textColor = fundState == isDepositState ? 'white' : 'black';
        return (
          <BoxButton
            style={{ backgroundColor: color }}
            onClick={() => setIsDepositState(fundState)}
          >
            <Description style={{ color: textColor }}> {balance} $MUSU </Description>
            <SubDescription style={{ color: textColor }}> {text} </SubDescription>
          </BoxButton>
        );
      };

      return (
        <ModalWrapper id='bridgeERC20' canExit overlay>
          <Header>Bridge $MUSU</Header>
          <Grid>
            <div style={{ width: '100%', gridRow: 1, gridColumn: 1 }}>{StateBox(true)}</div>
            <div style={{ width: '100%', gridRow: 1, gridColumn: 2 }}>{StateBox(false)}</div>
            <Description style={{ gridRow: 2, gridColumnStart: 1, gridColumnEnd: 3 }}>
              Bridge $MUSU between your wallet (ERC20) and the game world.
            </Description>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gridRow: 4,
                gridColumnStart: 1,
                gridColumnEnd: 3,
              }}
            >
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
            <div style={{ gridRow: 5, gridColumnStart: 1, gridColumnEnd: 3 }}>{TxButton()}</div>
          </Grid>
        </ModalWrapper>
      );
    }
  );
}

const BoxButton = styled.button`
  display: flex;
  flex-direction: column;
  width: 100%;

  background-color: #fff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;

  pointerevents: 'auto';
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
  color: #ff785b;
  text-align: center;
  padding: 4px;
  font-family: Pixel;

  cursor: pointer;
  border-width: 0px;
  background-color: #ffffff;
`;
