import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatUnits, parseEther } from 'viem';

import { IconButton, StepButton } from 'app/components/library';
import { getEvmWalletProvider } from 'app/utils';
import { TokenIcons } from 'assets/images/tokens';
import { abbreviateAddress } from 'utils/address';
import { DEAD_ADDRESS, YOMINET_RPC_URL } from './constants';
import { BridgeUpdateTone, EVMWalletProvider } from './types';
import { getNativeBalance, toHexQuantity } from './utils';

const ETH_INPUT_REGEX = /^\d*\.?\d{0,7}$/;

// Reserve enough native ETH for the owner to pay gas (e.g. account creation tx)
const GAS_RESERVE_WEI = parseEther('0.0002');

const getSpendable = (balanceWei: bigint): bigint => {
  const spendable = balanceWei - GAS_RESERVE_WEI;
  return spendable > 0n ? spendable : 0n;
};

const getSmartDefault = (balanceWei: bigint): string => {
  const spendable = getSpendable(balanceWei);
  if (spendable <= 0n) return '';
  const num = Number(formatUnits(spendable, 18));
  if (num <= 0) return '';
  // Trim trailing zeros, e.g. "0.000900" → "0.0009"
  return num.toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
};

const formatBalance = (wei: bigint): string => {
  const num = Number(formatUnits(wei, 18));
  return num.toFixed(6).replace(/\.?0+$/, '');
};

type BridgeFundStepProps = {
  ownerAddress: string;
  operatorAddress: string;
  injectedWallet: Parameters<typeof getEvmWalletProvider>[0];
  appendUpdate: (tone: BridgeUpdateTone, text: string) => void;
  onComplete: () => void;
  onSkip: () => void;
};

export const BridgeFundStep = ({
  ownerAddress,
  operatorAddress,
  injectedWallet,
  appendUpdate,
  onComplete,
  onSkip,
}: BridgeFundStepProps) => {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<bigint>(0n);
  const [isSending, setIsSending] = useState(false);
  const hasEdited = useRef(false);

  // Fetch native Yominet balance
  useEffect(() => {
    if (!ownerAddress || ownerAddress === DEAD_ADDRESS || !YOMINET_RPC_URL) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const bal = await getNativeBalance(YOMINET_RPC_URL, ownerAddress);
        if (!cancelled) setBalance(bal);
      } catch {
        // ignore
      }
    };
    fetch();
    const id = setInterval(fetch, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ownerAddress]);

  // Smart default
  useEffect(() => {
    if (hasEdited.current) return;
    const smart = getSmartDefault(balance);
    if (smart !== amount) setAmount(smart);
  }, [balance]);

  const spendable = getSpendable(balance);

  const { overBudget, parsedWei } = useMemo(() => {
    if (!amount || Number(amount) <= 0) return { overBudget: false, parsedWei: null };
    try {
      const wei = parseEther(amount);
      return { overBudget: wei > spendable, parsedWei: wei };
    } catch {
      return { overBudget: false, parsedWei: null };
    }
  }, [amount, spendable]);

  const isAmountValid = !!parsedWei && parsedWei > 0n && !overBudget;

  // Input handlers (Kamiswap pattern)
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
      setAmount(getSmartDefault(balance));
    }
  };

  const nudge = (direction: 1 | -1) => {
    const current = Number(amount) || 0;
    const next = Math.max(0, +(current + direction * 0.001).toFixed(7));
    hasEdited.current = true;
    setAmount(next === 0 ? '' : next.toString());
  };

  const handleFund = async () => {
    if (!parsedWei || isSending) return;

    setIsSending(true);
    let wallet: EVMWalletProvider | undefined;
    try {
      wallet = await getEvmWalletProvider(injectedWallet);
    } catch {
      // ignore
    }
    if (!wallet) {
      appendUpdate('error', 'No connected wallet found.');
      setIsSending(false);
      return;
    }

    try {
      appendUpdate('status', 'Sending gas to operator...');
      const hash = await wallet.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: ownerAddress,
            to: operatorAddress,
            value: toHexQuantity(parsedWei),
          },
        ],
      });
      if (typeof hash === 'string') {
        appendUpdate('meta', `Funding Tx: ${hash}`);
      }
      appendUpdate('success', 'Operator funded! You can now close this module.');
      onComplete();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Transaction failed';
      appendUpdate('error', msg);
      setIsSending(false);
    }
  };

  return (
    <FormColumn>
      <Title>Fund Your Operator</Title>
      <Description>Your operator needs gas to play. Send some ETH to get started.</Description>
      <OperatorAddress>
        Operator: {abbreviateAddress(operatorAddress)}
      </OperatorAddress>
      <Label>Amount</Label>
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
        />
        <StepButton label='-' onStep={() => nudge(-1)} />
        <StepButton label='+' onStep={() => nudge(1)} />
      </InputRow>
      <BalanceRow>
        <EthIcon src={TokenIcons.eth} alt='ETH' $small />
        <BalanceText>{formatBalance(spendable)} available (gas reserved)</BalanceText>
      </BalanceRow>
      {overBudget ? (
        <IconButton text='Not Enough Funds' disabled color='#F8D6D6' fullWidth />
      ) : (
        <IconButton
          text={isSending ? 'Sending...' : 'Fund Operator'}
          onClick={handleFund}
          disabled={!isAmountValid || isSending}
          color='#C2F0C2'
          fullWidth
        />
      )}
      <SkipButton onClick={onSkip}>Skip for now</SkipButton>
    </FormColumn>
  );
};

const FormColumn = styled.div`
  display: flex;
  flex: 0 0 17.75vw;
  flex-direction: column;
  gap: 0.55vw;
  min-height: 0;
  padding-left: 0.4vw;
  padding-right: 0.4vw;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`;

const Title = styled.div`
  font-size: 1.1vw;
  font-weight: 700;
  color: #333;
`;

const Description = styled.div`
  font-size: 0.76vw;
  color: #999;
`;

const OperatorAddress = styled.div`
  font-size: 0.72vw;
  color: #666;
  background: #f0f0f0;
  border-radius: 0.4vw;
  padding: 0.35vw 0.5vw;
`;

const Label = styled.label`
  font-size: 0.76vw;
  color: #333;
  font-weight: 700;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35vw;
`;

const EthIcon = styled.img<{ $small?: boolean }>`
  width: ${({ $small }) => ($small ? '0.9vw' : '1.1vw')};
  height: ${({ $small }) => ($small ? '0.9vw' : '1.1vw')};
`;

const Input = styled.input`
  background: #fafafa;
  border: 0.12vw solid #ccc;
  border-radius: 0.5vw;
  padding: 0.45vw 0.6vw;
  font-size: 0.78vw;
  text-align: center;
  flex: 1;
  min-width: 0;
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
    color: #aaa;
  }
`;

const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25vw;
  margin-left: 0.2vw;
`;

const BalanceText = styled.div`
  font-size: 0.72vw;
  color: #999;
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 0.72vw;
  text-decoration: underline;
  cursor: pointer;
  pointer-events: auto;
  padding: 0.2vw;
  align-self: center;

  &:hover {
    color: #666;
  }
`;
