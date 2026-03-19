import SwapVertIcon from '@mui/icons-material/SwapVert';
import styled from 'styled-components';

import { IconButton, IconListButton, Text, TextTooltip } from 'app/components/library';
import { MenuIcons } from 'assets/images/icons/menu';
import { formatEthPriceLabel } from 'utils/numbers';
import {
  BridgeFormActions,
  BridgeFormState,
  BridgeFormStatus,
  CHAIN_ICON_BY_CHAIN_ID,
  DISABLED_SOURCE_CHAIN_IDS,
  MIN_BRIDGE_AMOUNT,
  SOURCE_CHAIN_OPTIONS,
  YOMINET_CHAIN_OPTION,
} from './helpers/constants';

type BridgeFormProps = {
  state: BridgeFormState;
  status: BridgeFormStatus;
  actions: BridgeFormActions;
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

export const BridgeForm = ({ state, status, actions }: BridgeFormProps) => {
  const { externalChain, direction, amount, parsedAmount, externalBalance, yomiBalance } = state;
  const { isBridging, accountReady, hasSufficientSourceBalance } = status;
  const { onAmountChange, onSourceChainChange, onSwapDirection, onSubmit } = actions;

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

  const chainSelector = (
    <IconListButton
      img={CHAIN_ICON_BY_CHAIN_ID[externalChain.chainId]}
      text={externalChain.label}
      fullWidth
      scale={2.2}
      disabled={isBridging}
      options={SOURCE_CHAIN_OPTIONS.map((option) => ({
        text: option.label,
        image: CHAIN_ICON_BY_CHAIN_ID[option.chainId],
        disabled: DISABLED_SOURCE_CHAIN_IDS.has(option.chainId),
        onClick: () => onSourceChainChange(option),
      }))}
    />
  );

  const yominetDisplay = (
    <FixedChainRow>
      <ChainIcon src={CHAIN_ICON_BY_CHAIN_ID[YOMINET_CHAIN_OPTION.chainId]} />
      <ChainText>Yominet</ChainText>
    </FixedChainRow>
  );

  const bridgeLabel = direction === 'in' ? `Bridge to Yominet` : `Bridge to ${externalChain.label}`;

  return (
    <FormColumn>
      <Label>Source Chain</Label>
      {direction === 'in' ? chainSelector : yominetDisplay}
      <SwapRow>
        <IconButton img={SwapVertIcon} onClick={onSwapDirection} disabled={isBridging} scale={2} />
      </SwapRow>
      <Label>Destination Chain</Label>
      {direction === 'in' ? yominetDisplay : chainSelector}
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
          <BalanceLabel>
            {direction === 'in' ? `${externalChain.label} balance:` : 'Yominet bridged ETH:'}
          </BalanceLabel>
          <Text size={0.8}>
            <BalanceNumber>
              {formatEthPriceLabel(direction === 'in' ? externalBalance : yomiBalance, 5)}
            </BalanceNumber>{' '}
            ETH
          </Text>
        </BalanceItem>
        <BalanceItem>
          <BalanceLabel>
            {direction === 'in' ? 'Yominet bridged ETH:' : `${externalChain.label} balance:`}
          </BalanceLabel>
          <Text size={0.8}>
            <BalanceNumber>
              {formatEthPriceLabel(direction === 'in' ? yomiBalance : externalBalance, 5)}
            </BalanceNumber>{' '}
            ETH
          </Text>
        </BalanceItem>
      </Balances>
      <TextTooltip text={disabledReason ? [disabledReason] : []} fullWidth cursor='help'>
        <IconButton
          img={MenuIcons.kami}
          text={isBridging ? 'Bridging...' : bridgeLabel}
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

const ChainText = styled.div`
  font-size: 0.78vw;
  color: #111;
`;

const SwapRow = styled.div`
  display: flex;
  justify-content: center;
`;

const FixedChainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  border-radius: 0.5vw;
  padding: 0.45vw;
  background: #f0f0f0;
`;

const ChainIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
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
