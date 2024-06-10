import { EntityID, EntityIndex } from '@mud-classic/recs';
import { waitForActionCompletion } from 'network/utils';
import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { ActionButton, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork } from 'app/stores';
import { GasConstants } from 'constants/gas';
import { playFund } from 'utils/sounds';

export function registerFundOperatorModal() {
  registerUIComponent(
    'FundOperator',
    {
      colStart: 30,
      colEnd: 70,
      rowStart: 30,
      rowEnd: 74,
    },
    (layers) =>
      interval(1000).pipe(
        map(() => {
          return { network: layers.network };
        })
      ),

    ({ network }) => {
      const { actions, world } = network;
      const { account: kamiAccount } = useAccount();
      const { selectedAddress, apis } = useNetwork();

      const [isFunding, setIsFunding] = useState(true);
      const [amount, setAmount] = useState(0.05);
      const [statusText, setStatusText] = useState('');
      const [statusColor, setStatusColor] = useState('grey');

      /////////////////
      // SUBSCRIPTIONS

      useWatchBlockNumber({
        onBlockNumber: (n) => {
          refetchOwnerBalance();
          refetchOperatorBalance();
        },
      });

      const { data: OwnerBalance, refetch: refetchOwnerBalance } = useBalance({
        address: kamiAccount.ownerAddress as `0x${string}`,
      });

      const { data: OperatorBalance, refetch: refetchOperatorBalance } = useBalance({
        address: kamiAccount.operatorAddress as `0x${string}`,
      });

      /////////////////
      // ACTIONS

      const fundTx = async () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'AccountFund',
          params: [amount.toString()],
          description: `Funding Operator ${amount.toString()}`,
          execute: async () => {
            return api.account.fund(amount.toString());
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions!.Action, actionIndex);
      };

      // refund the specified eth balance to the owner from the burner/operator address
      const refundTx = async () => {
        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'AccountRefund',
          params: [amount.toString()],
          description: `Refunding Owner ${amount.toString()}`,
          execute: async () => {
            return network.api.player.account.refund(amount.toString());
          },
        });
        const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
        await waitForActionCompletion(actions!.Action, actionIndex);
      };

      /////////////////
      // INTERACTIONS

      const chooseTx = async () => {
        playFund();
        isFunding ? await fundTx() : await refundTx();
      };

      const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          chooseTx();
        }
      };

      const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(Number(event.target.value));
      };

      ///////////////
      // DISPLAY

      const TxButton = () => {
        const text = isFunding! ? 'Fund Operator' : 'Send to Owner';
        return <ActionButton onClick={chooseTx} size='large' text={text} />;
      };

      const StateBox = (fundState: boolean) => {
        const text = fundState ? 'Owner' : 'Operator';
        const balance = fundState
          ? Number(formatUnits(OwnerBalance?.value ?? 0n, 18)).toFixed(4)
          : Number(formatUnits(OperatorBalance?.value ?? 0n, 18)).toFixed(4);
        const color = fundState == isFunding ? 'grey' : 'white';
        const textColor = fundState == isFunding ? 'white' : 'black';
        return (
          <BoxButton style={{ backgroundColor: color }} onClick={() => setIsFunding(fundState)}>
            <Description style={{ color: textColor }}> {balance} ETH </Description>
            <SubDescription style={{ color: textColor }}> {text} </SubDescription>
          </BoxButton>
        );
      };

      useEffect(() => {
        const curBal = Number(
          formatUnits((isFunding ? OwnerBalance : OperatorBalance)?.value ?? 0n, 18)
        );

        if (amount > curBal) {
          setStatusText('Insufficient balance');
          setStatusColor('#FF785B');
        } else if (amount == curBal) {
          setStatusText('Leave a little for gas!');
          setStatusColor('#FF785B');
        } else {
          setStatusColor('grey');
          // placeholder gas estimation
          if (isFunding) {
            if (amount < GasConstants.Low)
              setStatusText('This might not last very long. Consider more?');
            else if (amount < GasConstants.Full) setStatusText('This should last you for a while');
            else setStatusText('This should last you for quite a while');
          } else {
            const remainBal = curBal - amount;
            setStatusText("You'd have " + remainBal.toFixed(4).toString() + ' ETH left');
          }
        }
      }, [amount, OwnerBalance, OperatorBalance, isFunding]);

      return (
        <ModalWrapper id='operatorFund' canExit overlay>
          <Grid>
            <Header>Operator gas</Header>
            <Row>
              {StateBox(true)}
              {StateBox(false)}
            </Row>
            <Description>
              Fund operator. You need gas to function. Better description to follow.
            </Description>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              <Input
                style={{ pointerEvents: 'auto' }}
                type='number'
                step='0.01'
                onKeyDown={(e) => catchKeys(e)}
                placeholder='0.05'
                onChange={(e) => handleChange(e)}
              ></Input>
              <WarnText style={{ color: statusColor }}>{statusText}</WarnText>
            </div>
            {TxButton()}
          </Grid>
        </ModalWrapper>
      );
    }
  );
}

const BoxButton = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 90%;
  min-width: 100px;
  padding: 0.5vh 0;
  margin: 0 0.5vw;

  background-color: #fff;
  border-style: solid;
  border-width: 0.15vw;
  border-color: black;
  color: black;

  pointerevents: 'auto';
`;

const Header = styled.p`
  color: black;
  padding: 0.75vw;

  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;

  padding: 1vh 1vw;
  margin: 2vh 0;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row wrap;
  align-items: center;
  width: 100%;
`;

const Description = styled.p`
  font-size: 1vw;
  color: black;
  text-align: center;
  padding: 0.5vw;
  font-family: Pixel;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;

  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1.5vw;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 1vh 1vw;

  &:focus {
    outline: none;
  }
`;

const SubDescription = styled.p`
  font-size: 0.8vw;
  color: grey;
  text-align: center;
  padding: 0.1vw;
  font-family: Pixel;
  width: 100%;
`;

const WarnText = styled.div`
  font-size: 0.8vw;
  color: #ff785b;
  text-align: center;
  padding: 0.75vw;
  font-family: Pixel;

  cursor: pointer;
  border-width: 0px;
  background-color: #ffffff;
`;
