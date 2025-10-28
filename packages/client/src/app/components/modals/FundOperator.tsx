import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { IconButton, ModalWrapper, Overlay, Text } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useTokens } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { GasConstants, GasExponent } from 'constants/gas';
import { EntityID, EntityIndex } from 'engine/recs';
import { waitForActionCompletion } from 'network/utils';
import { useBridgeOpener } from 'network/utils/hooks';
import { parseTokenBalance } from 'utils/numbers';
import { playFund } from 'utils/sounds';

export const FundOperator: UIComponent = {
  id: 'FundOperator',
  Render: () => {
    const layers = useLayers();

    const { network } = layers;
    const { actions, world } = network;

    const kamiAccount = useAccount((s) => s.account);
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const ownerBalance = useTokens((s) => s.eth.balance);
    const openBridge = useBridgeOpener();

    const [isFunding, setIsFunding] = useState(true);
    const [amount, setAmount] = useState(GasConstants.Full);
    const [statusText, setStatusText] = useState('');
    const [statusColor, setStatusColor] = useState('grey');
    const [currBalance, setCurrBalance] = useState(0);

    const fullGas = GasConstants.Full; // js floating points are retarded

    /////////////////
    // SUBSCRIPTIONS

    useWatchBlockNumber({
      onBlockNumber: (n) => {
        refetchOwnerBalance();
        refetchOperatorBalance();
      },
    });

    const { data: OwnerBalance, refetch: refetchOwnerBalance } = useBalance({
      address: kamiAccount.ownerAddress,
    });

    const { data: OperatorBalance, refetch: refetchOperatorBalance } = useBalance({
      address: kamiAccount.operatorAddress,
    });

    // update the operating balance when mode or balanceds change
    useEffect(() => {
      const balanceResult = isFunding ? OwnerBalance : OperatorBalance;
      const currBal = parseTokenBalance(balanceResult?.value ?? 0n, GasExponent);
      setCurrBalance(currBal);
    }, [isFunding, OwnerBalance, OperatorBalance]);

    // run the primary check(s) for this validator, track in store for easy access
    useEffect(() => {
      if (amount >= currBalance - GasConstants.Warning) {
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
          const remainBal = currBalance - amount;
          setStatusText("You'd have " + remainBal.toFixed(4).toString() + ' ETH left');
        }
      }
    }, [amount, currBalance]);

    const needsToBridge = () => {
      return ownerBalance < GasConstants.Empty && import.meta.env.MODE !== 'puter';
    };

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
        description: `Funding Operator ${amount.toString()} ETH`,
        execute: async () => {
          return api.send(kamiAccount.operatorAddress, amount);
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
        description: `Refunding Owner ${amount.toString()} ETH`,
        execute: async () => {
          return network.api.player.send(kamiAccount.ownerAddress, amount);
        },
      });
      const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
      await waitForActionCompletion(actions!.Action, actionIndex);
    };

    /////////////////
    // INTERACTIONS

    const triggerAction = async () => {
      playFund();
      isFunding ? await fundTx() : await refundTx();
    };

    const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        triggerAction();
      }
    };

    // handle the input balance change based on mode and state
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = Number(event.target.value);
      if (isFunding) {
        newValue = Math.max(fullGas / 10, newValue);
        newValue = Math.min(currBalance, newValue);
        newValue = Math.min(fullGas * 10, newValue);
      } else {
        newValue = Math.min(currBalance, newValue);
      }

      newValue = Math.max(0, newValue);
      setAmount(newValue);
    };

    ///////////////
    // DISPLAY

    const StateBox = (fundState: boolean) => {
      const text = fundState ? 'Owner' : 'Operator';
      const balance = fundState
        ? Number(formatUnits(OwnerBalance?.value ?? 0n, GasExponent)).toFixed(5)
        : Number(formatUnits(OperatorBalance?.value ?? 0n, GasExponent)).toFixed(5);
      const color = fundState == isFunding ? 'grey' : 'white';
      const textColor = fundState == isFunding ? 'white' : 'black';
      return (
        <BoxButton style={{ backgroundColor: color }} onClick={() => setIsFunding(fundState)}>
          <Overlay top={0.3} left={0.3}>
            <Text size={0.75} color={textColor}>
              {text}
            </Text>
          </Overlay>
          <Text size={1.2} color={textColor}>
            {balance}
          </Text>
          <Overlay bottom={0.3} right={0.3}>
            <Text size={0.9} color={textColor}>
              ETH
            </Text>
          </Overlay>
        </BoxButton>
      );
    };

    /////////////////
    // RENDER

    return (
      <ModalWrapper id='operatorFund' canExit overlay truncate>
        <Header>
          <Text size={1.5}>Operator gas</Text>
          <Text size={0.9}>Your Operator needs gas to function.</Text>
        </Header>
        <Row>
          {StateBox(true)}
          {StateBox(false)}
        </Row>
        {isFunding && needsToBridge() ? (
          <BridgeGroup>
            <WarnText>You need to bridge some ETH first.</WarnText>
            <IconButton img={TokenIcons.init} onClick={openBridge} text={'Bridge ETH'} />
          </BridgeGroup>
        ) : (
          <Column>
            <Row>
              <Input
                style={{ pointerEvents: 'auto' }}
                type='number'
                value={amount.toFixed(5)}
                step={0.0001}
                min={0}
                max={currBalance}
                onKeyDown={(e) => catchKeys(e)}
                onChange={(e) => handleChange(e)}
                placeholder={GasConstants.Full.toString()}
              />
              <IconButton
                onClick={triggerAction}
                scale={3}
                text={isFunding! ? 'Fund Operator' : 'Send to Owner'}
              />
            </Row>
            <WarnText style={{ color: statusColor }}>{statusText}</WarnText>
          </Column>
        )}
      </ModalWrapper>
    );
  },
};

const Header = styled.div`
  color: black;
  padding: 1.2vw;
  gap: 0.3vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const BoxButton = styled.button`
  position: relative;
  border: solid black 0.15vw;
  background-color: #fff;

  width: 45%;
  padding: 1.8vw 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  pointerevents: 'auto';
`;

const Row = styled.div`
  display: flex;
  flex-direction: row nowrap;
  align-items: center;
  justify-content: center;

  gap: 0.6vw;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1vw;
  padding: 0.6vw;
  margin-top: 1.2vw;
`;

const Input = styled.input`
  display: inline-block;
  border-radius: 0.45vw;
  width: 12vw;
  padding: 1vh 0.6vw;

  font-size: 1.2vw;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  &:focus {
    outline: none;
  }
`;

const WarnText = styled.div`
  background-color: #ffffff;
  color: #ff785b;
  padding: 0.75vw;

  font-size: 0.8vw;
  text-align: center;
`;

const BridgeGroup = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  padding: 0.6vw;
`;
