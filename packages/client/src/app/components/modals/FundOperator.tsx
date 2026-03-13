import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits, parseEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { IconButton, ModalWrapper, StepButton, Text } from 'app/components/library';
import { triggerBridgeModal } from 'app/triggers';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useTokens } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { GasConstants } from 'constants/gas';
import { EntityID, EntityIndex } from 'engine/recs';
import { waitForActionCompletion } from 'network/utils';
import { playFund } from 'utils/sounds';

const MIN_AMOUNT_ETH = 0.00001;
const ETH_INPUT_REGEX = /^\d*\.?\d{0,7}$/;

const FUND_TIERS = [
  GasConstants.Full,    // 0.01
  GasConstants.Half,    // 0.005
  GasConstants.Quarter, // 0.0025
  GasConstants.Low,     // 0.001
  GasConstants.Warning, // 0.0001
];

const getSmartDefault = (balanceWei: bigint): string => {
  for (const tier of FUND_TIERS) {
    try {
      if (balanceWei >= parseEther(tier.toString())) return tier.toString();
    } catch {
      continue;
    }
  }
  return '';
};

const formatBalance = (wei: bigint): string => {
  const num = Number(formatUnits(wei, 18));
  return num.toFixed(6).replace(/\.?0+$/, '');
};

export const FundOperator: UIComponent = {
  id: 'FundOperator',
  Render: () => {
    const layers = useLayers();

    const { network } = layers;
    const { actions, world } = network;

    const kamiAccount = useAccount((s) => s.account);
    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const ownerEthBalance = useTokens((s) => s.eth.balance);
    const [isFunding, setIsFunding] = useState(true);
    const [amount, setAmount] = useState('');
    const hasEdited = useRef(false);

    /////////////////
    // SUBSCRIPTIONS

    useWatchBlockNumber({
      onBlockNumber: () => {
        refetchOwnerBalance();
        refetchOperatorBalance();
      },
    });

    const { data: ownerBalanceData, refetch: refetchOwnerBalance } = useBalance({
      address: kamiAccount.ownerAddress,
    });

    const { data: operatorBalanceData, refetch: refetchOperatorBalance } = useBalance({
      address: kamiAccount.operatorAddress,
    });

    /////////////////
    // INTERPRETATION

    const ownerBalanceWei = ownerBalanceData?.value ?? 0n;
    const operatorBalanceWei = operatorBalanceData?.value ?? 0n;
    const sourceBalanceWei = isFunding ? ownerBalanceWei : operatorBalanceWei;
    const sourceBalanceData = isFunding ? ownerBalanceData : operatorBalanceData;

    const ownerFormatted = formatBalance(ownerBalanceWei);
    const operatorFormatted = formatBalance(operatorBalanceWei);

    useEffect(() => {
      if (hasEdited.current || !sourceBalanceData) return;
      const smart = getSmartDefault(sourceBalanceWei);
      if (smart !== amount) setAmount(smart);
    }, [sourceBalanceWei]);

    const { overBudget, parsedWei } = useMemo(() => {
      if (!amount || Number(amount) <= 0) return { overBudget: false, parsedWei: null };
      try {
        const wei = parseEther(amount);
        return { overBudget: wei > sourceBalanceWei, parsedWei: wei };
      } catch {
        return { overBudget: false, parsedWei: null };
      }
    }, [amount, sourceBalanceWei]);

    const isAmountValid = !!parsedWei && parsedWei > 0n && !overBudget;

    const statusMessage = useMemo(() => {
      if (!amount || Number(amount) <= 0) return '';
      if (overBudget) return '';
      if (!parsedWei) return '';

      if (isFunding) {
        const remaining = sourceBalanceWei - parsedWei;
        const warningWei = parseEther(GasConstants.Warning.toString());
        if (remaining < warningWei) return 'Leave a little for gas!';
        const num = Number(amount);
        if (num < GasConstants.Low) return 'This might not last very long';
        if (num < GasConstants.Full) return 'This should last you for a while';
        return 'This should last you for quite a while';
      } else {
        const remaining = sourceBalanceWei - parsedWei;
        return `Operator would have ${formatBalance(remaining)} ETH left`;
      }
    }, [amount, sourceBalanceWei, isFunding, overBudget, parsedWei]);

    const isWarning = useMemo(() => {
      if (!parsedWei || overBudget) return false;
      const remaining = sourceBalanceWei - parsedWei;
      const warningWei = parseEther(GasConstants.Warning.toString());
      return remaining < warningWei;
    }, [parsedWei, sourceBalanceWei, overBudget]);

    const needsToBridge = () => {
      return ownerEthBalance < GasConstants.Empty && import.meta.env.MODE !== 'puter';
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
        params: [amount],
        description: `Funding Operator ${amount} ETH`,
        execute: async () => {
          return api.send(kamiAccount.operatorAddress, amount);
        },
      });
      const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
      await waitForActionCompletion(actions!.Action, actionIndex);
    };

    const refundTx = async () => {
      const actionID = uuid() as EntityID;
      actions.add({
        id: actionID,
        action: 'AccountRefund',
        params: [amount],
        description: `Refunding Owner ${amount} ETH`,
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

    const handleFocus = () => {
      hasEdited.current = true;
      setAmount('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || ETH_INPUT_REGEX.test(val)) {
        hasEdited.current = true;
        setAmount(val);
      }
    };

    const handleBlur = () => {
      const num = Number(amount);
      if (!amount || !num || num <= 0) {
        hasEdited.current = false;
        setAmount(getSmartDefault(sourceBalanceWei));
        return;
      }
      let val = amount;
      if (num > 0 && num < MIN_AMOUNT_ETH) val = MIN_AMOUNT_ETH.toString();
      if (val.includes('.')) val = val.replace(/0+$/, '').replace(/\.$/, '');
      val = val.replace(/^0+(\d)/, '$1');
      if (val !== amount) setAmount(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
        if (isAmountValid) triggerAction();
      }
    };

    const nudge = (direction: 1 | -1) => {
      const current = Number(amount) || 0;
      const next = Math.max(0, +(current + direction * 0.001).toFixed(7));
      hasEdited.current = true;
      setAmount(next === 0 ? '' : next.toString());
    };

    const switchMode = (funding: boolean) => {
      setIsFunding(funding);
      hasEdited.current = false;
      const balance = funding ? ownerBalanceWei : operatorBalanceWei;
      setAmount(getSmartDefault(balance));
    };

    /////////////////
    // RENDER

    const actionLabel = isFunding ? 'Fund Operator' : 'Send to Owner';

    return (
      <ModalWrapper id='operatorFund' canExit overlay truncate>
        <Header>
          <Text size={1.5}>Operator Gas</Text>
          <Subtitle>Your Operator needs gas to function.</Subtitle>
        </Header>
        <ModeRow>
          <ModeButton $active={isFunding} onClick={() => switchMode(true)}>
            <ModeLabel>Owner</ModeLabel>
            <ModeBalanceRow>
              <EthIcon src={TokenIcons.eth} alt='ETH' />
              <ModeBalance>{ownerFormatted}</ModeBalance>
            </ModeBalanceRow>
          </ModeButton>
          <ModeButton $active={!isFunding} onClick={() => switchMode(false)}>
            <ModeLabel>Operator</ModeLabel>
            <ModeBalanceRow>
              <EthIcon src={TokenIcons.eth} alt='ETH' />
              <ModeBalance>{operatorFormatted}</ModeBalance>
            </ModeBalanceRow>
          </ModeButton>
        </ModeRow>
        <DirectionLabelRow>
          <DirectionHint>
            {isFunding ? 'Owner \u2192 Operator' : 'Operator \u2192 Owner'}
          </DirectionHint>
          <Dot>&middot;</Dot>
          <AvailableRow>
            <EthIcon src={TokenIcons.eth} alt='ETH' />
            <AvailableText>{formatBalance(sourceBalanceWei)} available</AvailableText>
          </AvailableRow>
        </DirectionLabelRow>
        {isFunding && needsToBridge() ? (
          <BridgeGroup>
            <StatusText $warn>You need to bridge some ETH first.</StatusText>
            <IconButton img={MenuIcons.kami} onClick={() => triggerBridgeModal()} text='Bridge ETH' />
          </BridgeGroup>
        ) : (
          <ActionColumn>
            <InputRow>
              <EthIcon src={TokenIcons.eth} alt='ETH' $large />
              <Input
                type='text'
                inputMode='decimal'
                placeholder='Input Amount'
                value={amount}
                onFocus={handleFocus}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{ pointerEvents: 'auto' }}
              />
              <StepButton label='-' onStep={() => nudge(-1)} />
              <StepButton label='+' onStep={() => nudge(1)} />
            </InputRow>
            <StatusText $warn={isWarning}>{statusMessage || '\u00A0'}</StatusText>
            {overBudget ? (
              <IconButton text='Not Enough Funds' disabled color='#F8D6D6' scale={3} width={14} />
            ) : (
              <IconButton
                text={actionLabel}
                onClick={triggerAction}
                disabled={!isAmountValid}
                color='#C2F0C2'
                scale={3}
                width={14}
              />
            )}
          </ActionColumn>
        )}
      </ModalWrapper>
    );
  },
};

const Header = styled.div`
  padding: 1vw 1.2vw 0.6vw;
  gap: 0.2vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Subtitle = styled.div`
  font-size: 0.85vw;
  color: #999;
`;

const ModeRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  gap: 0.5vw;
  padding: 0 0.6vw;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  border: 0.12vw solid ${({ $active }) => ($active ? '#a0c0e8' : '#ddd')};
  border-radius: 0.6vw;
  background: ${({ $active }) => ($active ? '#e8f0fe' : '#fafafa')};
  color: #333;
  cursor: pointer;

  width: 45%;
  padding: 0.8vw 0.6vw;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.3vw;

  transition: background 0.15s, border-color 0.15s;
  pointer-events: auto;

  &:hover {
    background: ${({ $active }) => ($active ? '#dce8fa' : '#f0f0f0')};
  }
`;

const ModeLabel = styled.div`
  font-size: 0.7vw;
  color: #999;
`;

const ModeBalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25vw;
`;

const ModeBalance = styled.div`
  font-size: 1.05vw;
  font-weight: 600;
  color: #444;
`;

const EthIcon = styled.img<{ $large?: boolean }>`
  width: ${({ $large }) => ($large ? '1.4vw' : '1.1vw')};
  height: ${({ $large }) => ($large ? '1.4vw' : '1.1vw')};
`;

const DirectionLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35vw;
  padding: 0.3vw 0;
`;

const DirectionHint = styled.div`
  font-size: 0.7vw;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
`;

const Dot = styled.span`
  font-size: 0.9vw;
  color: #bbb;
`;

const AvailableRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2vw;
`;

const AvailableText = styled.div`
  font-size: 0.7vw;
  color: #999;
`;

const ActionColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
  padding: 0.4vw 0.6vw;
  margin-top: 0.3vw;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.35vw;
`;

const Input = styled.input`
  background: #fafafa;
  border: 0.12vw solid #ccc;
  border-radius: 0.5vw;

  color: #333;
  width: 12vw;
  height: 2.4vw;
  padding: 0.5vw 0.6vw;

  font-size: 1.1vw;
  text-align: center;
  caret-color: transparent;
  cursor: pointer;

  &::placeholder {
    color: transparent;
  }

  &:focus {
    border-color: #a0c0e8;
    background: #fff9e0;
    outline: none;
  }

  &:focus::placeholder {
    color: #bbb;
  }
`;

const StatusText = styled.div<{ $warn?: boolean }>`
  font-size: 0.75vw;
  text-align: center;
  min-height: 1vw;
  color: ${({ $warn }) => ($warn ? '#d97706' : '#999')};
`;

const BridgeGroup = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  margin-top: 0.6vw;
`;
