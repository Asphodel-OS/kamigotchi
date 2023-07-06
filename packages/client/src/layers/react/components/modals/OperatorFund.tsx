/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { registerUIComponent } from 'layers/react/engine/store';
import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';
import { useBalance } from 'wagmi';

import { Account, getAccount } from '../shapes/Account';
import { dataStore } from 'layers/react/store/createStore';
import { useKamiAccount } from 'layers/react/store/kamiAccount';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionButton } from 'layers/react/components/library/ActionButton';

// more complex controls to allow operator funding and refunding 
export function registerOperatorFund() {
  registerUIComponent(
    'OperatorFund',
    {
      colStart: 28,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 74,
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

      const [IsFundState, setIsFundState] = useState(true);
      const [Amount, setAmount] = useState(0.05);
      const [StatusText, setStatusText] = useState("");
      const [StatusColor, setStatusColor] = useState("grey");


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
      // TRANSACTIONS

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
            return account.fund(Amount.toString());
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
            return account.refund(Amount.toString());
          },
        });
        return actionID;
      };

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, operatorFund: false });
      }, [setVisibleModals, visibleModals]);

      /////////////////
      // DISPLAY LOGIC

      const chooseTx = () => {
        if (IsFundState) {
          return fundTx();
        } else {
          return refundTx();
        }
      }

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          chooseTx();
        }
      };

      const setMax = () => {
        setAmount(Number(OwnerBal?.formatted));
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(event.target.value));
      };

      ///////////////
      // COMPONENTS

      const TxButton = () => {
        const text = IsFundState! ? "Fund Operator" : "Send to Owner";
        return (
          <ActionButton id='button-deposit' onClick={chooseTx} size='large' text={text} />
        );
      };

      const StateBox = (fundState: boolean) => {
        const text = fundState ? "Owner" : "Operator";
        const balance = fundState ? Number(OwnerBal?.formatted).toFixed(4) : Number(OperatorBal?.formatted).toFixed(4);
        const color = (fundState == IsFundState) ? "grey" : "white";
        const textColor = (fundState == IsFundState) ? "white" : "black";
        return (
          <BoxButton style={{ backgroundColor: color }} onClick={() => setIsFundState(fundState)}>
            <Description style={{ color: textColor }}> {balance} ETH </Description>
            <SubDescription style={{ color: textColor }}> {text} </SubDescription>
          </BoxButton>
        );
      };

      useEffect(() => {
        const curBal = IsFundState ? Number(OwnerBal?.formatted) : Number(OperatorBal?.formatted);

        if (Amount > curBal) {
          setStatusText("Insufficient balance");
          setStatusColor("#FF785B");
        }
        else if (Amount == curBal) {
          setStatusText("Leave a little for gas!");
          setStatusColor("#FF785B");
        }
        else {
          setStatusColor("grey");
          // placeholder gas estimation
          if (IsFundState) setStatusText("This should last you for approximately 1000 transactions")
          else {
            const remainBal = curBal - Amount;
            setStatusText("You'd have " + remainBal.toFixed(4).toString() + " ETH left");
          };
        }
      }, [Amount, OwnerBal, OperatorBal, IsFundState]);

      return (
        <ModalWrapperFull divName='operatorFund' id='operatorFund'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <Header>Operator gas</Header>
          <Grid>
            <div style={{ width: '100%', gridRow: 1, gridColumn: 1 }}>
              {StateBox(true)}
            </div>
            <div style={{ width: '100%', gridRow: 1, gridColumn: 2 }}>
              {StateBox(false)}
            </div>
            <Description style={{ gridRow: 2, gridColumnStart: 1, gridColumnEnd: 3 }}>
              Fund operator. You need gas to function. Better description to follow.
            </Description>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gridRow: 4, gridColumnStart: 1, gridColumnEnd: 3 }}>
              <Input
                style={{ pointerEvents: 'auto' }}
                type='number'
                step='0.01'
                onKeyDown={(e) => catchKeys(e)}
                placeholder='0.05'
                value={Amount}
                onChange={(e) => handleChange(e)}
              ></Input>
              <WarnText style={{ color: StatusColor }}>{StatusText}</WarnText>
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
  font-size: 24px;
  color: black;
  text-align: center;
  font-family: Pixel;
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
