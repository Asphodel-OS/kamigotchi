import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { PortalConfigs } from 'app/cache/config';
import { getInventoryBalance } from 'app/cache/inventory';
import { StepButton, Text } from 'app/components/library';
import { useTokens } from 'app/stores';
import { GasConstants } from 'constants/gas';
import { Tokens } from 'constants/tokens';
import { Inventory, Item } from 'network/shapes';
import { playClick } from 'utils/sounds';
import {
  findWalletPair,
  fmtTokenAmt,
  getNeededDeposit,
  getResultWithdraw,
  getSwapRate,
  getTokenMeta,
} from '../utils';
import { Mode } from './types';

// depositing the gas token itself must leave the owner wallet enough to keep
// signing: the MAX chip and the cap hold back this much ETH
const GAS_RESERVE_ETH = GasConstants.Low;

// pastel action color, shared with the FundOperator and Pool modals
const GREEN = '#C2F0C2';

// floor to a safe non-negative number at `decimals` places. guards negatives /
// non-finite so a bad amount can never reach the tx builders
const safeAmt = (v: number, decimals = 0) => {
  if (!Number.isFinite(v) || v < 0) return 0;
  const f = 10 ** decimals;
  return Math.floor(v * f + 1e-9) / f;
};

// deposit stepper: 1 whole token for coarse scales (ONYX), 0.001 for fine
// ones (ETH at scale 5) so a step is never a whole ETH
const depositStep = (scale: number) => (scale > 2 ? 10 ** -(scale - 2) : 1);

export const Swap = ({
  actions,
  data,
  state,
}: {
  actions: {
    approve: (item: Item, amt: number) => Promise<void>;
    deposit: (item: Item, amt: number, convertAmt: number) => Promise<void>;
    withdraw: (item: Item, amt: number) => Promise<void>;
  };
  data: {
    config: PortalConfigs;
    inventory: Inventory[];
  };
  state: {
    mode: Mode;
    selected: Item;
  };
}) => {
  const { approve, deposit, withdraw } = actions;
  const { config, inventory } = data;
  const { mode, selected } = state;
  // wallet balance/allowance of whichever portal token is selected. TokenChecker
  // keeps every supported token in the balances map, keyed by address
  const balances = useTokens((s) => s.balances);
  const wallet = findWalletPair(balances, selected.token?.address) ?? { allowance: 0, balance: 0 };
  const token = getTokenMeta(selected);
  const isGasToken =
    (selected.token?.address ?? '').toLowerCase() === Tokens.ETH.address.toLowerCase();

  // DEPOSIT: whole tokens paid in. WITHDRAW: item units withdrawn.
  const [amt, setAmt] = useState<number>(0);
  useEffect(() => setAmt(0), [mode, selected.index]);

  /////////////////
  // INTERPRETATION

  const rate = getSwapRate(selected); // item units per 1 token
  const scale = selected.token?.scale ?? 0;
  const itemBalance = getInventoryBalance(inventory, selected.index);

  // deposit: most items receivable within the $ONYX typed in.
  // getNeededDeposit rounds, so walk down until the charge fits
  const unitsIn = Math.floor(amt * rate + 1e-9);
  let receiveItems = Math.max(
    0,
    Math.floor(unitsIn * (1 - config.tax.import.rate)) - config.tax.import.flat
  );
  while (receiveItems > 0 && getNeededDeposit(config, receiveItems) > unitsIn) receiveItems--;
  const depositUnits = getNeededDeposit(config, receiveItems); // exact units charged

  const receivedUnits = getResultWithdraw(config, amt); // item units a withdrawal pays out

  // deposits are typed in whole tokens with `scale` decimals; withdrawals in item units
  const depositable = isGasToken ? Math.max(0, wallet.balance - GAS_RESERVE_ETH) : wallet.balance;
  const maxAmt = mode === 'DEPOSIT' ? safeAmt(depositable, scale) : itemBalance;
  const needsApproval = mode === 'DEPOSIT' && depositUnits / rate > wallet.allowance;
  const insufficient = amt > maxAmt;
  const zeroOutput = amt > 0 && (mode === 'DEPOSIT' ? receiveItems <= 0 : receivedUnits <= 0);
  const blocked = amt <= 0 || insufficient || zeroOutput;

  /////////////////
  // ACTIONS

  const triggerAction = () => {
    if (blocked) return;
    if (mode === 'DEPOSIT') {
      if (needsApproval) {
        // keep the typed amount: the user approved exactly this deposit and
        // the button flips to 'deposit' once the allowance lands
        approve(selected, depositUnits / rate);
        return;
      }
      deposit(selected, receiveItems, depositUnits);
    } else {
      withdraw(selected, amt);
    }
    setAmt(0);
  };

  /////////////////
  // DISPLAY

  const actionText = () => {
    if (insufficient)
      return mode === 'DEPOSIT' ? `insufficient ${token.symbol}` : 'insufficient balance';
    if (zeroOutput) return 'amount too small';
    if (mode === 'DEPOSIT') return needsApproval ? `approve ${token.symbol}` : 'deposit';
    return 'withdraw';
  };

  const itemCard = (
    <SideBlock>
      <HeadRow>
        <Text size={0.95}>
          {mode === 'DEPOSIT' ? `You're receiving (in-game)` : `You're withdrawing (in-game)`}
        </Text>
        <Text size={0.75} color='#999'>
          balance: {itemBalance} (~{fmtTokenAmt(itemBalance, selected)} {token.symbol})
        </Text>
      </HeadRow>
      <TradeCard>
        <ItemBlockBox>
          <BigSprite src={selected.image} alt={selected.name} />
          <ItemName>{selected.name}</ItemName>
        </ItemBlockBox>
        {mode === 'WITHDRAW' ? (
          <AmountBox value={amt} set={setAmt} max={maxAmt} />
        ) : (
          <OutputField>{amt > 0 ? `${receiveItems}` : '0'}</OutputField>
        )}
      </TradeCard>
    </SideBlock>
  );

  const tokenCard = (
    <SideBlock>
      <HeadRow>
        <Text size={0.95}>
          {mode === 'DEPOSIT' ? `You're paying (wallet)` : `You're receiving (wallet)`}
        </Text>
        <Text size={0.75} color='#999'>
          wallet: {wallet.balance.toFixed(scale > 0 ? Math.min(scale, 5) : 0)} {token.symbol}
        </Text>
      </HeadRow>
      <TradeCard>
        <ItemBlockBox>
          <BigSprite src={token.icon} alt={token.symbol} />
          <ItemName>{token.symbol}</ItemName>
        </ItemBlockBox>
        {mode === 'DEPOSIT' ? (
          <AmountBox
            value={amt}
            set={setAmt}
            max={maxAmt}
            decimals={scale}
            step={depositStep(scale)}
          />
        ) : (
          <OutputField>{amt > 0 ? `~${(receivedUnits / rate).toFixed(scale)}` : '0'}</OutputField>
        )}
      </TradeCard>
    </SideBlock>
  );

  return (
    <Section>
      {mode === 'DEPOSIT' ? (
        <>
          {tokenCard}
          {itemCard}
        </>
      ) : (
        <>
          {itemCard}
          {tokenCard}
        </>
      )}

      <Info>
        {mode === 'DEPOSIT' && isGasToken && (
          <Text size={0.72} color='#888'>
            max leaves {GAS_RESERVE_ETH} ETH in your wallet for gas
          </Text>
        )}
        {mode === 'DEPOSIT' && needsApproval && amt > 0 && (
          <Text size={0.72} color='#888'>
            approval required before depositing
          </Text>
        )}
        {zeroOutput && (
          <Text size={0.72} color='#b23b3b'>
            ⚠ amount too small: taxes consume it entirely
          </Text>
        )}
      </Info>

      <ActionButton
        $color={GREEN}
        disabled={blocked}
        onClick={() => {
          playClick();
          triggerAction();
        }}
      >
        {actionText()}
      </ActionButton>
    </Section>
  );
};

/////////////////
// SUBCOMPONENTS

// gas-modal-style amount control: centered input flanked by press-and-hold
// steppers, with a MAX chip. `max` clamps typing and the steppers. `decimals`
// > 0 allows fractional tokens (deposits); 0 keeps item units integral
const AmountBox = ({
  value,
  set,
  max,
  decimals = 0,
  step = 1,
}: {
  value: number;
  set: (n: number) => void;
  max: number;
  decimals?: number;
  step?: number;
}) => {
  const [focused, setFocused] = useState(false);
  // the raw text is kept so a trailing "." or "0.00" survives while typing
  const [text, setText] = useState('');
  // external resets (mode/token switch, MAX, steppers) re-derive the text; a
  // partially typed "0." or "0.00" already reads as 0 and is left alone
  useEffect(() => {
    if (Number(text) === value) return;
    setText(value === 0 ? '' : String(value));
  }, [value]);

  const cap = (n: number) => Math.min(n, max);
  const pattern = decimals > 0 ? new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`) : /^\d+$/;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') {
      setText('');
      return set(0);
    }
    if (!pattern.test(v)) return;
    setText(v);
    set(cap(safeAmt(Number(v), decimals)));
  };
  const nudge = (dir: 1 | -1) => set(cap(safeAmt(value + dir * step, decimals)));

  return (
    <AmountRow>
      <StepButton label='-' onStep={() => nudge(-1)} />
      <AmountField
        type='text'
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        placeholder={focused ? 'amount' : '0'}
        value={text}
        onChange={onChange}
        // clear on focus so a click starts a fresh number (mirrors FundOperator)
        onFocus={() => {
          setFocused(true);
          setText('');
          set(0);
        }}
        onBlur={() => setFocused(false)}
        style={{ pointerEvents: 'auto' }}
      />
      <StepButton label='+' onStep={() => nudge(1)} />
      <MaxChip
        onClick={() => {
          playClick();
          set(max);
        }}
      >
        MAX
      </MaxChip>
    </AmountRow>
  );
};

/////////////////
// STYLES

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vh;
`;

const SideBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5vh;
`;

const HeadRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
  padding: 0 0.2vw;
`;

const ActionButton = styled.button<{ $color: string }>`
  width: 100%;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  background: ${({ $color }) => $color};
  padding: 0.6vw;
  font-family: Pixel;
  font-size: 0.9vw;
  color: black;
  cursor: pointer;
  pointer-events: auto;
  &:hover {
    filter: brightness(0.95);
  }
  &:disabled {
    background: #bbb;
    cursor: default;
    pointer-events: none;
  }
`;

const TradeCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8vw;
  border: 0.12vw solid #ddd;
  border-radius: 0.6vw;
  padding: 0.7vw 0.8vw;
`;

const ItemBlockBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const BigSprite = styled.img`
  width: 2.6vw;
  height: 2.6vw;
  image-rendering: pixelated;
  user-drag: none;
`;

const ItemName = styled.div`
  flex: 1;
  min-width: 0;
  font-family: Pixel;
  font-size: 0.95vw;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  flex-shrink: 0;
  width: 16vw;
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
  caret-color: transparent;
  cursor: pointer;

  &::selection {
    background: transparent;
  }
  &::placeholder {
    color: #bbb;
  }

  &:focus {
    border-color: #a0c0e8;
    background: #fff9e0;
    outline: none;
  }
`;

const OutputField = styled.div`
  flex-shrink: 0;
  width: 11vw;
  height: 2.4vw;
  background: #f4f4f4;
  border: 0.12vw solid #e0e0e0;
  border-radius: 0.5vw;
  color: #555;

  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Pixel;
  font-size: 1.05vw;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4vh;
  padding: 0 0.2vw;
`;

const MaxChip = styled.button`
  flex-shrink: 0;
  height: 1.8vw;
  padding: 0 0.5vw;
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  background: #fafafa;
  color: #555;
  font-family: Pixel;
  font-size: 0.65vw;
  cursor: pointer;
  pointer-events: auto;
  transition:
    background 0.12s,
    border-color 0.12s;
  &:hover {
    background: #e8f0fe;
    border-color: #a0c0e8;
  }
`;
