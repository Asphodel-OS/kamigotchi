import styled from 'styled-components';

import { IconButton, IconListButton, Text, TextTooltip } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { formatEthPriceLabel } from 'utils/numbers';
import {
  DISABLED_SOURCE_CHAIN_IDS,
  EVMChainOption,
  MIN_BRIDGE_AMOUNT,
  SOURCE_CHAIN_ICON_BY_CHAIN_ID,
  SOURCE_CHAIN_OPTIONS,
} from './helpers/constants';

type BridgeFormProps = {
  sourceChain: EVMChainOption;
  // chains the router can currently route from; null = not probed (all enabled)
  routableChainIds: Set<string> | null;
  amount: string;
  parsedAmount: bigint | null;
  sourceBalance: bigint;
  yomiBalance: bigint;
  isBridging: boolean;
  accountReady: boolean;
  hasSufficientSourceBalance: boolean;
  onAmountChange: (amount: string) => void;
  onSourceChainChange: (chain: EVMChainOption) => void;
  onSubmit: () => void;
};

const getDisabledReason = (
  isBridging: boolean,
  accountReady: boolean,
  hasSufficientSourceBalance: boolean,
  parsedAmount: bigint | null
): string | undefined => {
  if (isBridging) return 'Bridge transaction in progress.';
  if (!accountReady) return 'Connect your wallet first.';
  if (!parsedAmount || parsedAmount < MIN_BRIDGE_AMOUNT) return 'Minimum amount is 0.000001 ETH.';
  if (!hasSufficientSourceBalance) return 'Insufficient source chain balance.';
  return undefined;
};

export const BridgeForm = ({
  sourceChain,
  routableChainIds,
  amount,
  parsedAmount,
  sourceBalance,
  yomiBalance,
  isBridging,
  accountReady,
  hasSufficientSourceBalance,
  onAmountChange,
  onSourceChainChange,
  onSubmit,
}: BridgeFormProps) => {
  const isDisabled =
    isBridging ||
    !accountReady ||
    !hasSufficientSourceBalance ||
    !parsedAmount ||
    parsedAmount < MIN_BRIDGE_AMOUNT;
  const disabledReason = getDisabledReason(
    isBridging,
    accountReady,
    hasSufficientSourceBalance,
    parsedAmount
  );

  return (
    <FormColumn>
      <Label>Source Chain</Label>
      <IconListButton
        img={SOURCE_CHAIN_ICON_BY_CHAIN_ID[sourceChain.chainId]}
        text={sourceChain.label}
        fullWidth
        scale={2.2}
        disabled={isBridging}
        options={SOURCE_CHAIN_OPTIONS.map((option) => {
          const unroutable = routableChainIds !== null && !routableChainIds.has(option.chainId);
          return {
            text: unroutable ? `${option.label} (unavailable)` : option.label,
            image: SOURCE_CHAIN_ICON_BY_CHAIN_ID[option.chainId],
            disabled: DISABLED_SOURCE_CHAIN_IDS.has(option.chainId) || unroutable,
            onClick: () => onSourceChainChange(option),
          };
        })}
      />
      <Label>Destination Chain</Label>
      <DestinationText>Yominet</DestinationText>
      <Label>Amount (ETH)</Label>
      <Input
        type='number'
        min='0'
        step='0.0001'
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
      />
      <Balances>
        <BalanceItem>
          <BalanceLabel>Source balance:</BalanceLabel>
          <Text size={0.8}>
            <BalanceNumber>{formatEthPriceLabel(sourceBalance, 5)}</BalanceNumber> ETH
          </Text>
        </BalanceItem>
        <BalanceItem>
          <BalanceLabel>Yominet bridged ETH:</BalanceLabel>
          <Text size={0.8}>
            <BalanceNumber>{formatEthPriceLabel(yomiBalance, 5)}</BalanceNumber> ETH
          </Text>
        </BalanceItem>
      </Balances>
      <TextTooltip text={disabledReason ? [disabledReason] : []} fullWidth cursor='help'>
        <IconButton
          img={MenuIcons.kami}
          text={isBridging ? 'Bridging...' : 'Bridge to Yominet'}
          onClick={onSubmit}
          disabled={isDisabled}
          fullWidth
        />
      </TextTooltip>
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

const Input = styled.input`
  border: solid black 0.12vw;
  border-radius: 0.5vw;
  padding: 0.45vw;
  font-size: 0.78vw;
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

const BalanceNumber = styled.span`
  margin-left: 1vw;
`;
