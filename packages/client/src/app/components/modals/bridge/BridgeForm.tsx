import styled from 'styled-components';

import { IconButton, StepButton, Text, TextTooltip } from 'app/components/library';
import { openBaselineLink } from 'app/components/modals/tokenPortal/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { formatEthPriceLabel } from 'utils/numbers';
import {
  BRIDGE_ASSET_OPTIONS,
  BridgeAssetId,
  EVMChainOption,
  getAssetsForChainId,
  getMinBridgeAmountLabel,
} from './helpers/constants';

const ACTIVE_ASSET_COLOR = '#e0eeff';
const PURCHASE_GREEN = '#C2F0C2';

type BridgeFormProps = {
  sourceChain: EVMChainOption;
  // source options the router can currently route from; null = not probed (all enabled)
  routableOptionIds: Set<string> | null;
  amount: string;
  parsedAmount: bigint | null;
  sourceBalance: bigint;
  yomiBalance: bigint;
  isBridging: boolean;
  accountReady: boolean;
  onyxLocked: boolean;
  hasSufficientSourceBalance: boolean;
  onAmountChange: (amount: string) => void;
  onAssetChange: (asset: BridgeAssetId) => void;
  onSubmit: () => void;
};

// free-typed amount: digits + up to 7 decimals (mirrors FundOperator)
const AMOUNT_INPUT_REGEX = /^\d*\.?\d{0,7}$/;

const getAssetLockReason = (
  asset: BridgeAssetId,
  availableAssets: Set<BridgeAssetId>
): string | undefined => {
  if (!availableAssets.has(asset)) return `${asset} is not available on this chain.`;
  return undefined;
};

const getDisabledReason = (
  sourceChain: EVMChainOption,
  isBridging: boolean,
  accountReady: boolean,
  hasSufficientSourceBalance: boolean,
  parsedAmount: bigint | null
): string | undefined => {
  if (isBridging) return 'Bridge transaction in progress.';
  if (!accountReady) return 'Connect your wallet first.';
  if (!parsedAmount || parsedAmount < sourceChain.minAmount)
    return `Minimum amount is ${getMinBridgeAmountLabel(sourceChain)}.`;
  if (!hasSufficientSourceBalance)
    return `Insufficient ${sourceChain.symbol} balance on ${sourceChain.label}.`;
  return undefined;
};

export const BridgeForm = ({
  sourceChain,
  routableOptionIds,
  amount,
  parsedAmount,
  sourceBalance,
  yomiBalance,
  isBridging,
  accountReady,
  onyxLocked,
  hasSufficientSourceBalance,
  onAmountChange,
  onAssetChange,
  onSubmit,
}: BridgeFormProps) => {
  const symbol = sourceChain.symbol;
  const availableAssets = new Set(
    getAssetsForChainId(sourceChain.chainId).map((asset) => asset.id)
  );
  const chainUnroutable = routableOptionIds !== null && !routableOptionIds.has(sourceChain.id);

  const handleAmountInput = (value: string) => {
    if (value === '' || AMOUNT_INPUT_REGEX.test(value)) onAmountChange(value);
  };

  // press-and-hold stepper: same step sizes the old number input used
  const nudge = (direction: 1 | -1) => {
    const step = sourceChain.asset === 'ONYX' ? 0.1 : 0.0001;
    const current = Number(amount) || 0;
    const next = Math.max(0, +(current + direction * step).toFixed(7));
    onAmountChange(next === 0 ? '' : next.toString());
  };
  const isDisabled =
    isBridging ||
    !accountReady ||
    !hasSufficientSourceBalance ||
    !parsedAmount ||
    parsedAmount < sourceChain.minAmount;
  const disabledReason = getDisabledReason(
    sourceChain,
    isBridging,
    accountReady,
    hasSufficientSourceBalance,
    parsedAmount
  );

  return (
    <FormColumn>
      <Label>Source Asset</Label>
      <AssetRow>
        {BRIDGE_ASSET_OPTIONS.map((asset) => {
          const lockReason = getAssetLockReason(asset.id, availableAssets);
          const isLocked = !!lockReason || (asset.id === 'ONYX' && onyxLocked);
          return (
            <AssetSlot key={asset.id}>
              <TextTooltip text={lockReason ? [lockReason] : []} fullWidth cursor='help'>
                <IconButton
                  img={asset.icon}
                  text={asset.label}
                  color={asset.id === sourceChain.asset ? ACTIVE_ASSET_COLOR : '#fff'}
                  onClick={() => onAssetChange(asset.id)}
                  disabled={isBridging || isLocked}
                  fullWidth
                  scale={2.2}
                />
              </TextTooltip>
            </AssetSlot>
          );
        })}
      </AssetRow>
      <Label>Source Chain</Label>
      <IconButton
        img={sourceChain.icon}
        text={chainUnroutable ? `${sourceChain.label} (unavailable)` : sourceChain.label}
        fullWidth
        scale={2.2}
        disabled={isBridging}
        onClick={() => undefined}
      />
      <Label>Amount ({symbol})</Label>
      <AmountRow>
        <StepButton label='-' onStep={() => nudge(-1)} />
        <AmountField
          type='text'
          inputMode='decimal'
          placeholder='0'
          value={amount}
          onChange={(event) => handleAmountInput(event.target.value)}
          style={{ pointerEvents: 'auto' }}
        />
        <StepButton label='+' onStep={() => nudge(1)} />
      </AmountRow>
      <Balances>
        <BalanceItem>
          <BalanceLabel>Source balance:</BalanceLabel>
          <Text size={0.8}>
            <BalanceNumber>{formatEthPriceLabel(sourceBalance, 5)}</BalanceNumber> {symbol}
          </Text>
        </BalanceItem>
        <BalanceItem>
          <BalanceLabel>Yominet bridged {symbol}:</BalanceLabel>
          <Text size={0.8}>
            <BalanceNumber>{formatEthPriceLabel(yomiBalance, 5)}</BalanceNumber> {symbol}
          </Text>
        </BalanceItem>
      </Balances>
      <TextTooltip text={disabledReason ? [disabledReason] : []} fullWidth cursor='help'>
        <IconButton
          img={MenuIcons.kami}
          text={isBridging ? 'Bridging...' : `Bridge ${symbol} to Yominet`}
          onClick={onSubmit}
          disabled={isDisabled}
          fullWidth
        />
      </TextTooltip>
      {sourceChain.asset === 'ONYX' && (
        <>
          <Rule />
          <PurchaseSlot>
            <IconButton
              fullWidth
              scale={2.2}
              color={PURCHASE_GREEN}
              text='Purchase $ONYX'
              onClick={() => openBaselineLink(sourceChain.sourceTokenAddress ?? '')}
            />
          </PurchaseSlot>
        </>
      )}
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

const AssetRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 0.4vw;
`;

const AssetSlot = styled.div`
  flex: 1 1 0;
  min-width: 0;
`;

const Rule = styled.div`
  border-top: 0.12vw solid #e0e0e0;
  margin-top: 0.15vw;
`;

const PurchaseSlot = styled.div``;

const AmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  flex-shrink: 0;
`;

const AmountField = styled.input`
  flex: 1;
  min-width: 0;
  background: #fafafa;
  border: 0.12vw solid #ccc;
  border-radius: 0.5vw;
  color: #333;
  height: 2.4vw;
  padding: 0.5vw 0.4vw;

  font-family: Pixel;
  font-size: 1.05vw;
  text-align: center;
  cursor: text;

  &::placeholder {
    color: #bbb;
  }

  &:focus {
    border-color: #a0c0e8;
    background: #fff9e0;
    outline: none;
  }
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
