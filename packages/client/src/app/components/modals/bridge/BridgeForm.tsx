import styled from 'styled-components';

import { IconButton, IconListButton, Text, TextTooltip } from 'app/components/library';
import { openBaselineLink } from 'app/components/modals/tokenPortal/utils';
import { MenuIcons } from 'assets/images/icons/menu';
import { formatEthPriceLabel } from 'utils/numbers';
import {
  BRIDGE_ASSET_OPTIONS,
  BridgeAssetId,
  DISABLED_SOURCE_CHAIN_IDS,
  EVMChainOption,
  getAssetsForChainId,
  getChainOptionsForAsset,
  getMinBridgeAmountLabel,
} from './helpers/constants';

const ACTIVE_ASSET_COLOR = '#e0eeff';
const PURCHASE_GREEN = '#C2F0C2';

type BridgeFormProps = {
  sourceChain: EVMChainOption;
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
  onSourceChainChange: (chain: EVMChainOption) => void;
  onSubmit: () => void;
};

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
  onSourceChainChange,
  onSubmit,
}: BridgeFormProps) => {
  const symbol = sourceChain.symbol;
  const chainOptions = getChainOptionsForAsset(sourceChain.asset);
  const availableAssets = new Set(
    getAssetsForChainId(sourceChain.chainId).map((asset) => asset.id)
  );
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
      <IconListButton
        img={sourceChain.icon}
        text={sourceChain.label}
        fullWidth
        scale={2.2}
        disabled={isBridging}
        options={chainOptions.map((option) => ({
          text: option.label,
          image: option.icon,
          disabled: DISABLED_SOURCE_CHAIN_IDS.has(option.chainId),
          onClick: () => onSourceChainChange(option),
        }))}
      />
      <Label>Amount ({symbol})</Label>
      <Input
        type='number'
        min='0'
        step={sourceChain.asset === 'ONYX' ? '0.1' : '0.0001'}
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
      />
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

const Input = styled.input`
  border: solid black 0.12vw;
  border-radius: 0.5vw;
  padding: 0.45vw;
  font-size: 0.78vw;
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
