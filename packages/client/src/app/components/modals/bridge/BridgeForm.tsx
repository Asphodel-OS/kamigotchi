import styled from 'styled-components';

import { IconButton, IconListButton, Text } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { formatEthPriceLabel } from 'utils/numbers';
import {
  DISABLED_SOURCE_CHAIN_IDS,
  EVMChainOption,
  SOURCE_CHAIN_ICON_BY_CHAIN_ID,
  SOURCE_CHAIN_OPTIONS,
} from './constants';

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
}: BridgeFormProps) => (
  <FormColumn>
    <Label>Source Chain</Label>
    <IconListButton
      img={SOURCE_CHAIN_ICON_BY_CHAIN_ID[sourceChain.chainId]}
      text={sourceChain.label}
      fullWidth
      scale={2.2}
      disabled={isBridging}
      options={SOURCE_CHAIN_OPTIONS.map((option) => ({
        text: option.label,
        image: SOURCE_CHAIN_ICON_BY_CHAIN_ID[option.chainId],
        disabled: DISABLED_SOURCE_CHAIN_IDS.has(option.chainId),
        onClick: () => onSourceChainChange(option),
      }))}
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
    <IconButton
      img={MenuIcons.kami}
      text={isBridging ? 'Bridging...' : 'Bridge to Yominet'}
      onClick={onSubmit}
      disabled={isBridging || !accountReady || !hasSufficientSourceBalance}
      fullWidth
    />
  </FormColumn>
);

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
