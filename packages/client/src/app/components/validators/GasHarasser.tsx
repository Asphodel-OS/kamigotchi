import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';
import { formatUnits, parseEther } from 'viem';
import { useBalance, useWatchBlockNumber } from 'wagmi';

import { IconButton, StepButton, ValidatorWrapper } from 'app/components/library';
import { triggerBridgeModal } from 'app/triggers';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useNetwork, useTokens, useVisibility } from 'app/stores';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { GasConstants, GasExponent } from 'constants/gas';
import { EntityID, EntityIndex } from 'engine/recs';
import { waitForActionCompletion } from 'network/utils';
import { playFund, playSuccess } from 'utils/sounds';

const MIN_FUND_ETH = 0.00001;
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

export const GasHarasser: UIComponent = {
  id: 'GasHarasser',
  Render: () => {
    const layers = useLayers();
    const { network } = layers;
    const { actions, world } = network;

    const account = useAccount((s) => s.account);
    const validations = useAccount((s) => s.validations);
    const setValidations = useAccount((s) => s.setValidations);

    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const apis = useNetwork((s) => s.apis);
    const networkValidations = useNetwork((s) => s.validations);

    const validators = useVisibility((s) => s.validators);
    const setValidators = useVisibility((s) => s.setValidators);
    const ownerEthBalance = useTokens((s) => s.eth.balance);

    const [amount, setAmount] = useState('');
    const hasEdited = useRef(false);

    /////////////////
    // SUBSCRIPTIONS

    useWatchBlockNumber({
      onBlockNumber: (n) => {
        if (n % 4n === 0n) refetch();
      },
    });

    const { data: operatorBalance, refetch } = useBalance({
      address: account.operatorAddress,
    });

    const { data: ownerBalanceData } = useBalance({
      address: account.ownerAddress,
    });

    /////////////////
    // TRACKING

    useEffect(() => {
      if (!validations.operatorMatches) return;
      if (!operatorBalance) return; // Don't evaluate until balance RPC returns
      const hasGas = hasEnoughGas(operatorBalance.value);
      if (hasGas !== validations.operatorHasGas) {
        setValidations({ ...validations, operatorHasGas: hasGas });
      }
    }, [validations.operatorMatches, operatorBalance]);

    useEffect(() => {
      const isVisible =
        networkValidations.authenticated &&
        networkValidations.chainMatches &&
        validations.accountExists &&
        validations.operatorMatches &&
        !validations.operatorHasGas;

      if (isVisible != validators.gasHarasser) {
        setValidators({
          walletConnector: false,
          accountRegistrar: false,
          operatorUpdater: false,
          gasHarasser: isVisible,
        });
      }
    }, [networkValidations, validations.operatorMatches, validations.operatorHasGas]);

    /////////////////
    // INTERPRETATION

    const hasEnoughGas = (value: bigint) => {
      return Number(formatUnits(value, GasExponent)) > GasConstants.Warning;
    };

    const needsToBridge = () => {
      return ownerEthBalance < GasConstants.Empty && import.meta.env.MODE !== 'puter';
    };

    const operatorBalanceWei = operatorBalance?.value ?? 0n;
    const operatorBalanceFormatted = formatBalance(operatorBalanceWei);
    const ownerBalanceWei = ownerBalanceData?.value ?? 0n;
    const ownerBalanceFormatted = formatBalance(ownerBalanceWei);

    useEffect(() => {
      if (hasEdited.current || !ownerBalanceData) return;
      const smart = getSmartDefault(ownerBalanceWei);
      if (smart !== amount) setAmount(smart);
    }, [ownerBalanceWei]);

    const { overBudget, parsedWei } = useMemo(() => {
      if (!amount || Number(amount) <= 0) return { overBudget: false, parsedWei: null };
      try {
        const wei = parseEther(amount);
        return { overBudget: wei > ownerBalanceWei, parsedWei: wei };
      } catch {
        return { overBudget: false, parsedWei: null };
      }
    }, [amount, ownerBalanceWei]);

    const isAmountValid = !!parsedWei && parsedWei > 0n && !overBudget;

    /////////////////
    // ACTION

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
          return api.send(account.operatorAddress, amount);
        },
      });
      const actionIndex = world.entityToIndex.get(actionID) as EntityIndex;
      await waitForActionCompletion(actions!.Action, actionIndex);
    };

    /////////////////
    // INTERACTION

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
        setAmount(getSmartDefault(ownerBalanceWei));
        return;
      }
      let val = amount;
      if (num > 0 && num < MIN_FUND_ETH) val = MIN_FUND_ETH.toString();
      if (val.includes('.')) val = val.replace(/0+$/, '').replace(/\.$/, '');
      if (val !== amount) setAmount(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
        if (isAmountValid) feed();
      }
    };

    const nudge = (direction: 1 | -1) => {
      const current = Number(amount) || 0;
      const next = Math.max(0, +(current + direction * 0.001).toFixed(7));
      hasEdited.current = true;
      setAmount(next === 0 ? '' : next.toString());
    };

    const feed = async () => {
      playFund();
      await fundTx();
      playSuccess();
    };

    /////////////////
    // DISPLAY

    return (
      <ValidatorWrapper
        id='gasHarasser'
        canExit
        divName='gasHarasser'
        title='Operator needs gas!'
        errorPrimary='pls feed me pls a crumb of ETH ._.'
      >
        <BalanceSection>
          <SectionLabel>Current Balance</SectionLabel>
          <BalanceDisplay $empty={operatorBalanceWei === 0n}>
            <EthIcon src={TokenIcons.eth} alt='ETH' $large />
            <BalanceValue $empty={operatorBalanceWei === 0n}>
              {operatorBalanceFormatted || '0'}
            </BalanceValue>
          </BalanceDisplay>
        </BalanceSection>

        {needsToBridge() ? (
          <BridgeGroup>
            <StatusText $warn>You need to bridge some ETH first.</StatusText>
            <IconButton img={MenuIcons.kami} onClick={() => triggerBridgeModal()} text='Bridge ETH' />
          </BridgeGroup>
        ) : (
          <FundSection>
            <SectionLabelRow>
              <SectionLabel>Fund from Wallet</SectionLabel>
              <Dot>&middot;</Dot>
              <AvailableRow>
                <EthIcon src={TokenIcons.eth} alt='ETH' />
                <AvailableText>{ownerBalanceFormatted} available</AvailableText>
              </AvailableRow>
            </SectionLabelRow>
            <ActionColumn>
              <InputRow>
                <EthIcon src={TokenIcons.eth} alt='ETH' />
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
              {overBudget ? (
                <IconButton text='Not Enough Funds' disabled color='#F8D6D6' fullWidth />
              ) : (
                <IconButton
                  text='Fund Operator'
                  onClick={feed}
                  disabled={!isAmountValid}
                  color='#C2F0C2'
                  fullWidth
                />
              )}
            </ActionColumn>
          </FundSection>
        )}
      </ValidatorWrapper>
    );
  },
};

const BalanceSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4vw;
  padding: 0.6vw 0;
`;

const SectionLabel = styled.div`
  font-size: 0.7vw;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
`;

const BalanceDisplay = styled.div<{ $empty: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4vw;

  background: ${({ $empty }) => ($empty ? '#fef2f2' : '#f0fdf4')};
  border: 0.08vw solid ${({ $empty }) => ($empty ? '#fecaca' : '#bbf7d0')};
  border-radius: 0.6vw;
  padding: 0.5vw 1.2vw;
`;

const BalanceValue = styled.div<{ $empty: boolean }>`
  font-size: 1.2vw;
  font-weight: 600;
  color: ${({ $empty }) => ($empty ? '#b91c1c' : '#15803d')};
`;

const BridgeGroup = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  margin-top: 0.8vw;
  gap: 0.8vw;
`;

const FundSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6vw;
  padding: 0.4vw 0;
`;

const SectionLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35vw;
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
  gap: 0.5vw;
  width: 16vw;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.35vw;
  width: 100%;
`;

const EthIcon = styled.img<{ $large?: boolean }>`
  width: ${({ $large }) => ($large ? '1.4vw' : '1.1vw')};
  height: ${({ $large }) => ($large ? '1.4vw' : '1.1vw')};
`;

const Input = styled.input`
  background: #fafafa;
  border: 0.12vw solid #ccc;
  border-radius: 0.5vw;

  color: #333;
  flex: 1;
  height: 2.2vw;
  padding: 0.4vw 0.6vw;

  font-size: 1vw;
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
  color: ${({ $warn }) => ($warn ? '#c44' : '#888')};
`;
