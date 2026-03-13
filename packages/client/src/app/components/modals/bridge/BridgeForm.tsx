import styled from 'styled-components';

import { IconButton, IconListButton, StepButton, Text } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { formatEthPriceLabel } from 'utils/numbers';
import {
  DISABLED_SOURCE_CHAIN_IDS,
  SOURCE_CHAIN_ICON_BY_CHAIN_ID,
  SOURCE_CHAIN_OPTIONS,
} from './constants';
import { EVMChainOption } from './types';

type BridgeFormProps = {
  sourceChain: EVMChainOption;
  amount: string;
  sourceBalance: bigint;
  yomiBalance: bigint;
  isBridging: boolean;
  accountReady: boolean;
  hasSufficientSourceBalance: boolean;
  onAmountChange: (amount: string) => void;
  onSourceChainChange: (chain: EVMChainOption) => void;
  onSubmit: () => void;
};

export const BridgeForm = ({
  sourceChain,
  amount,
  sourceBalance,
  yomiBalance,
  isBridging,
  accountReady,
  hasSufficientSourceBalance,
  onAmountChange,
  onSourceChainChange,
  onSubmit,
}: BridgeFormProps) => {
  const DEFAULT_AMOUNT = '0.001';
  const STEP = 0.001;

  const handleBlur = () => {
    const num = Number(amount);
    if (!amount || !num || num < Number(DEFAULT_AMOUNT)) {
      onAmountChange(DEFAULT_AMOUNT);
    }
  };

  const nudge = (direction: 1 | -1) => {
    const current = Number(amount) || 0;
    const raw = +(current + direction * STEP).toFixed(7);
    const next = Math.max(Number(DEFAULT_AMOUNT), raw);
    onAmountChange(next.toString());
  };

  return (
  <FormColumn>
    <Label>Source Chain</Label>
    <IconListButton
      img={SOURCE_CHAIN_ICON_BY_CHAIN_ID[sourceChain.chainId]}
      text={sourceChain.label}
      fullWidth
      scale={2.2}
      disabled={isBridging}
      optionFontSize='0.75vw'
      options={SOURCE_CHAIN_OPTIONS.map((option) => ({
        text: option.label,
        image: SOURCE_CHAIN_ICON_BY_CHAIN_ID[option.chainId],
        disabled: DISABLED_SOURCE_CHAIN_IDS.has(option.chainId),
        onClick: () => onSourceChainChange(option),
      }))}
    />
    <Label>Destination Chain</Label>
    <DestinationText>Yominet</DestinationText>
    <Label>Amount</Label>
    <InputRow>
      <EthIcon src={TokenIcons.eth} alt='ETH' />
      <Input
        type='text'
        inputMode='decimal'
        placeholder='Input Amount'
        value={amount}
        onFocus={() => onAmountChange('')}
        onBlur={handleBlur}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || /^\d*\.?\d{0,7}$/.test(val)) onAmountChange(val);
        }}
      />
      <StepButton label='-' onStep={() => nudge(-1)} />
      <StepButton label='+' onStep={() => nudge(1)} />
    </InputRow>
    <Balances>
      <BalanceItem>
        <BalanceLabel>Source balance:</BalanceLabel>
        <BalanceValueRow>
          <EthIcon src={TokenIcons.eth} alt='ETH' $small />
          <Text size={0.8}>{formatEthPriceLabel(sourceBalance, 5)}</Text>
        </BalanceValueRow>
      </BalanceItem>
      <BalanceItem>
        <BalanceLabel>Yominet bridged:</BalanceLabel>
        <BalanceValueRow>
          <EthIcon src={TokenIcons.eth} alt='ETH' $small />
          <Text size={0.8}>{formatEthPriceLabel(yomiBalance, 5)}</Text>
        </BalanceValueRow>
      </BalanceItem>
    </Balances>
    <IconButton
      img={MenuIcons.kami}
      text={isBridging ? 'Bridging...' : 'Bridge to Yominet'}
      onClick={onSubmit}
      disabled={isBridging || !accountReady || !hasSufficientSourceBalance}
      fullWidth
    />
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


const DestinationText = styled.div`
  border-radius: 0.5vw;
  padding: 0.45vw;
  font-size: 0.78vw;
  color: #111;
  background: #f0f0f0;
`;

const Balances = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
  border: solid #e6e6e6 0.1vw;
  border-radius: 0.5vw;
  padding: 0.5vw;
  background: #eef8ee;
`;

const BalanceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.12vw;
`;

const BalanceLabel = styled.span`
  font-size: 0.78vw;
  font-weight: 700;
`;

const BalanceValueRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25vw;
  margin-left: 0.4vw;
`;
