import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { PortalConfigs } from 'app/cache/config';
import { getInventoryBalance } from 'app/cache/inventory';
import { StepButton, Text } from 'app/components/library';
import { IconButton } from 'app/components/library/buttons';
import { useTokens } from 'app/stores';
import { TokenIcons } from 'assets/images/tokens';
import { Inventory, Item } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { getNeededDeposit, getResultWithdraw, getSwapRate } from '../utils';
import { Mode } from './types';

// pastel action colors, shared with the FundOperator and Pool modals
const GREEN = '#C2F0C2';
const RED = '#F8D6D6';

// floor to a safe non-negative integer. guards negatives / non-finite so a bad
// amount can never reach the tx builders
const safeAmt = (v: number) => (!Number.isFinite(v) || v < 0 ? 0 : Math.floor(v));

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
  // hardcoded for now to just onyx
  const { allowance: onyxAllowance, balance: onyxBalance } = useTokens((s) => s.onyx);

  // DEPOSIT: whole $ONYX paid in. WITHDRAW: item units withdrawn.
  const [amt, setAmt] = useState<number>(0);
  useEffect(() => setAmt(0), [mode]);

  /////////////////
  // INTERPRETATION

  const rate = getSwapRate(selected); // item units per 1 token
  const scale = selected.token?.scale ?? 0;
  const itemBalance = getInventoryBalance(inventory, selected.index);

  // deposit: most items receivable within the $ONYX typed in.
  // getNeededDeposit rounds, so walk down until the charge fits
  const unitsIn = amt * rate;
  let receiveItems = Math.max(
    0,
    Math.floor(unitsIn * (1 - config.tax.import.rate)) - config.tax.import.flat
  );
  while (receiveItems > 0 && getNeededDeposit(config, receiveItems) > unitsIn) receiveItems--;
  const depositUnits = getNeededDeposit(config, receiveItems); // exact units charged

  const receivedUnits = getResultWithdraw(config, amt); // item units a withdrawal pays out

  const maxAmt = mode === 'DEPOSIT' ? Math.floor(onyxBalance) : itemBalance;
  const needsApproval = mode === 'DEPOSIT' && depositUnits / rate > onyxAllowance;
  const insufficient = amt > maxAmt;
  const zeroOutput =
    amt > 0 && (mode === 'DEPOSIT' ? receiveItems <= 0 : receivedUnits <= 0);
  const blocked = amt <= 0 || insufficient || zeroOutput;

  /////////////////
  // ACTIONS

  const triggerAction = () => {
    if (blocked) return;
    if (mode === 'DEPOSIT') {
      if (needsApproval) approve(selected, depositUnits / rate);
      else deposit(selected, receiveItems, depositUnits);
    } else {
      withdraw(selected, amt);
    }
    setAmt(0);
  };

  /////////////////
  // DISPLAY

  const actionText = () => {
    if (insufficient) return mode === 'DEPOSIT' ? 'insufficient $ONYX' : 'insufficient balance';
    if (zeroOutput) return 'amount too small';
    if (mode === 'DEPOSIT') return needsApproval ? `approve $ONYX` : 'deposit';
    return 'withdraw';
  };

  const itemCard = (
    <SideBlock>
      <HeadRow>
        <Text size={0.95}>
          {mode === 'DEPOSIT' ? `You're receiving (in-game)` : `You're withdrawing (in-game)`}
        </Text>
        {mode === 'WITHDRAW' ? (
          <MaxLabel
            onClick={() => {
              playClick();
              setAmt(maxAmt);
            }}
            title='fill max'
          >
            balance: {itemBalance}
          </MaxLabel>
        ) : (
          <Text size={0.75} color='#999'>
            balance: {itemBalance}
          </Text>
        )}
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
        {mode === 'DEPOSIT' ? (
          <MaxLabel
            onClick={() => {
              playClick();
              setAmt(maxAmt);
            }}
            title='fill max'
          >
            wallet: {onyxBalance.toFixed(scale > 0 ? 2 : 0)} $ONYX
          </MaxLabel>
        ) : (
          <Text size={0.75} color='#999'>
            wallet: {onyxBalance.toFixed(scale > 0 ? 2 : 0)} $ONYX
          </Text>
        )}
      </HeadRow>
      <TradeCard>
        <ItemBlockBox>
          <BigSprite src={TokenIcons.onyx} alt='$ONYX' />
          <ItemName>$ONYX</ItemName>
        </ItemBlockBox>
        {mode === 'DEPOSIT' ? (
          <AmountBox value={amt} set={setAmt} max={maxAmt} />
        ) : (
          <OutputField>
            {amt > 0 ? `~${(receivedUnits / rate).toFixed(scale)}` : '0'}
          </OutputField>
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

      <IconButton
        fullWidth
        scale={2.6}
        color={blocked ? RED : GREEN}
        disabled={blocked}
        onClick={triggerAction}
        text={actionText()}
      />
    </Section>
  );
};

/////////////////
// SUBCOMPONENTS

// gas-modal-style amount control: centered input flanked by press-and-hold
// steppers, with a MAX chip. `max` clamps typing and the steppers
const AmountBox = ({ value, set, max }: { value: number; set: (n: number) => void; max: number }) => {
  const [focused, setFocused] = useState(false);
  const cap = (n: number) => Math.min(n, max);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') return set(0);
    if (/^\d+$/.test(v)) set(cap(safeAmt(Number(v))));
  };
  return (
    <AmountRow>
      <StepButton label='-' onStep={() => set(safeAmt(value - 1))} />
      <AmountField
        type='text'
        inputMode='numeric'
        placeholder={focused ? 'amount' : '0'}
        value={value === 0 ? '' : String(value)}
        onChange={onChange}
        // clear on focus so a click starts a fresh number (mirrors FundOperator)
        onFocus={() => {
          setFocused(true);
          set(0);
        }}
        onBlur={() => setFocused(false)}
        style={{ pointerEvents: 'auto' }}
      />
      <StepButton label='+' onStep={() => set(cap(safeAmt(value + 1)))} />
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

const MaxLabel = styled.div`
  font-family: Pixel;
  font-size: 0.75vw;
  color: #999;
  cursor: pointer;
  pointer-events: auto;
  &:hover {
    color: #333;
    text-decoration: underline;
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

