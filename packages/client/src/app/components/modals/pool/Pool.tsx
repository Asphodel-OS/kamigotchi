import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getAccount as _getAccount } from 'app/cache/account';
import { getInventoryBalance } from 'app/cache/inventory';
import {
  EmptyText,
  IconButton,
  ModalHeader,
  ModalWrapper,
  Popover,
  StepButton,
  Text,
} from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';
import { MUSU_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import {
  applySlippage,
  calcAmountOut,
  calcRemoveAmounts,
  calcSharesMinted,
  getAllPools,
  getPoolShares,
  Pool,
  quote,
} from 'network/shapes/Pool';
import { playClick } from 'utils/sounds';

const SLIPPAGE_BPS = 100; // 1% tolerance on swaps and liquidity adds

// pastel action colors, shared with the FundOperator modal
const GREEN = '#C2F0C2';
const RED = '#F8D6D6';

type Tab = 'swap' | 'liquidity';

// floor to a safe non-negative integer. guards negatives / non-finite so a bad
// amount ("1e999" -> Infinity) can never reach BigInt() downstream
const safeAmt = (v: number) => (!Number.isFinite(v) || v < 0 ? 0 : Math.floor(v));

// price readout: whole numbers render without thousands separators (a comma
// could be misread as a decimal point); below 100 we clamp to 2 decimals
// (trailing zeros trimmed). a nonzero price that rounds to 0 shows "<0.01" so a
// cheap item never reads as free
const fmtPrice = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 100) return String(Math.round(n));
  const rounded = Number(n.toFixed(2));
  return rounded === 0 ? '<0.01' : rounded.toString();
};

// the pool's headline market price. MUSU pools always price the other item in
// MUSU (MUSU is index 1, so it always sorts to itemA when present) regardless of
// swap direction. item/item pools have no canonical currency, so they orient to
// the swap direction — the card flips with the swap arrow (`inverted`)
const getPriceInfo = (pool?: Pool, inverted = false) => {
  if (!pool) return null;
  const musuIsA = pool.itemA.index === MUSU_INDEX;
  const musuIsB = pool.itemB.index === MUSU_INDEX;
  if (!musuIsA && !musuIsB) {
    const item = inverted ? pool.itemB : pool.itemA;
    const unit = inverted ? pool.itemA : pool.itemB;
    const itemReserve = inverted ? pool.reserveB : pool.reserveA;
    const unitReserve = inverted ? pool.reserveA : pool.reserveB;
    return {
      item,
      unitName: unit.name,
      unitImage: unit.image,
      price: itemReserve > 0 ? unitReserve / itemReserve : 0,
    };
  }
  const musuItem = musuIsA ? pool.itemA : pool.itemB;
  const item = musuIsA ? pool.itemB : pool.itemA;
  const musuReserve = musuIsA ? pool.reserveA : pool.reserveB;
  const itemReserve = musuIsA ? pool.reserveB : pool.reserveA;
  return {
    item,
    unitName: musuItem.name,
    unitImage: musuItem.image,
    price: itemReserve > 0 ? musuReserve / itemReserve : 0,
  };
};

// player-facing window for the item AMM: swap between pool pairs and
// add/remove liquidity for LP shares
export const PoolModal: UIComponent = {
  id: 'PoolModal',
  Render: () => {
    const layers = useLayers();
    const { network } = layers;
    const { world, components, actions, api } = network;
    const accountEntity = queryAccountFromEmbedded(network);

    const poolModalOpen = useVisibility((s) => s.modals.pool);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [pools, setPools] = useState<Pool[]>([]);
    const [poolID, setPoolID] = useState<string>('');
    const [tab, setTab] = useState<Tab>('swap');
    const [lastTick, setLastTick] = useState(Date.now());

    // swap state: sell itemA -> receive itemB when !inverted
    const [inverted, setInverted] = useState(false);
    const [swapInput, setSwapInput] = useState(0);

    // liquidity state
    const [addAmountA, setAddAmountA] = useState(0);
    const [removeShares, setRemoveShares] = useState(0);

    // ticking — only while open (the modal is permanently mounted, so an
    // unconditional interval would re-render every second for the whole session)
    useEffect(() => {
      if (!poolModalOpen) return;
      const timerID = setInterval(() => setLastTick(Date.now()), 1000);
      return () => clearInterval(timerID);
    }, [poolModalOpen]);

    // refresh pools + account on each tick while open
    useEffect(() => {
      if (!poolModalOpen) return;
      setPools(getAllPools(world, components));
      setAccount(_getAccount(world, components, accountEntity, { live: 2, inventory: 2 }));
    }, [lastTick, poolModalOpen, accountEntity]);

    const pool = useMemo(() => pools.find((p) => p.id === poolID) ?? pools[0], [pools, poolID]);
    const priceInfo = useMemo(() => getPriceInfo(pool, inverted), [pool, inverted]);

    // reset amount inputs whenever the effective pool changes — including the
    // silent fallback to pools[0] when a stored poolID drops out of the list,
    // so a stale amount can never execute against a different pair
    useEffect(() => {
      setSwapInput(0);
      setAddAmountA(0);
      setRemoveShares(0);
      setInverted(false);
    }, [pool?.id]);

    /////////////////
    // INTERPRETATION

    const getItemBalance = (itemIndex: number) =>
      getInventoryBalance(account.inventories ?? [], itemIndex);

    const swapIn = pool ? (inverted ? pool.itemB : pool.itemA) : undefined;
    const swapOut = pool ? (inverted ? pool.itemA : pool.itemB) : undefined;
    const reserveIn = pool ? (inverted ? pool.reserveB : pool.reserveA) : 0;
    const reserveOut = pool ? (inverted ? pool.reserveA : pool.reserveB) : 0;
    const swapOutput = pool ? calcAmountOut(swapInput, reserveIn, reserveOut, pool.feeBps) : 0;

    const addAmountB = pool ? quote(addAmountA, pool.reserveA, pool.reserveB) : 0;
    const sharesMinted = pool ? calcSharesMinted(pool, addAmountA, addAmountB) : 0;
    const playerShares = pool ? getPoolShares(world, components, pool.id, account.id) : 0;
    const [removeA, removeB] = pool ? calcRemoveAmounts(pool, removeShares) : [0, 0];

    /////////////////
    // ACTIONS

    const swap = () => {
      if (!pool || !swapIn || !swapOut || swapInput <= 0) return;
      const minOut = applySlippage(swapOutput, SLIPPAGE_BPS);
      actions.add({
        action: 'PoolSwap',
        params: [swapIn.index, swapOut.index, swapInput, minOut],
        description: `Swapping ${swapInput} ${swapIn.name} for ~${swapOutput} ${swapOut.name}`,
        execute: async () => {
          return api.player.pool.swap(swapIn.index, swapOut.index, swapInput, minOut);
        },
      });
    };

    const addLiquidity = () => {
      if (!pool || addAmountA <= 0 || addAmountB <= 0) return;
      const minA = applySlippage(addAmountA, SLIPPAGE_BPS);
      const minB = applySlippage(addAmountB, SLIPPAGE_BPS);
      actions.add({
        action: 'PoolLiquidityAdd',
        params: [pool.itemA.index, pool.itemB.index, addAmountA, addAmountB, minA, minB],
        description: `Adding ${addAmountA} ${pool.itemA.name} + ${addAmountB} ${pool.itemB.name} to pool`,
        execute: async () => {
          return api.player.pool.liquidity.add(
            pool.itemA.index,
            pool.itemB.index,
            addAmountA,
            addAmountB,
            minA,
            minB
          );
        },
      });
    };

    const removeLiquidity = () => {
      if (!pool || removeShares <= 0) return;
      const minA = applySlippage(removeA, SLIPPAGE_BPS);
      const minB = applySlippage(removeB, SLIPPAGE_BPS);
      actions.add({
        action: 'PoolLiquidityRemove',
        params: [pool.itemA.index, pool.itemB.index, removeShares, minA, minB],
        description: `Removing liquidity from ${pool.itemA.name}/${pool.itemB.name} pool`,
        execute: async () => {
          return api.player.pool.liquidity.remove(
            pool.itemA.index,
            pool.itemB.index,
            removeShares,
            minA,
            minB
          );
        },
      });
    };

    /////////////////
    // INTERACTIONS

    const selectPool = (id: string) => {
      playClick();
      setPoolID(id);
      setSwapInput(0);
      setAddAmountA(0);
      setRemoveShares(0);
    };

    const switchTab = (t: Tab) => {
      playClick();
      setTab(t);
    };

    const flip = () => {
      playClick();
      setInverted(!inverted); // reset: the amount re-denominates to the other item
      setSwapInput(0);
    };

    /////////////////
    // RENDERING

    const renderPicker = () => (
      <Popover
        fullWidth
        content={
          <PickerList>
            {pools.map((p) => (
              <PickerItem key={p.id} onClick={() => selectPool(p.id)}>
                <PairIcons>
                  <Sprite src={p.itemA.image} />
                  <Sprite src={p.itemB.image} />
                </PairIcons>
                <Text size={0.85}>
                  {p.itemA.name} / {p.itemB.name}
                  {p.disabled ? '  (paused)' : ''}
                </Text>
              </PickerItem>
            ))}
          </PickerList>
        }
      >
        <PickerTrigger onClick={() => playClick()}>
          {pool ? (
            <PickerLabel>
              <PairIcons>
                <Sprite src={pool.itemA.image} />
                <Sprite src={pool.itemB.image} />
              </PairIcons>
              <Text size={1}>
                {pool.itemA.name} / {pool.itemB.name}
                {pool.disabled ? '  (paused)' : ''}
              </Text>
            </PickerLabel>
          ) : (
            <Text size={1} color='#999'>
              no pools
            </Text>
          )}
          <Caret>▾</Caret>
        </PickerTrigger>
      </Popover>
    );

    const renderSwap = () => {
      if (!pool || !swapIn || !swapOut)
        return <EmptyText text={['No pools available.', 'Check back later!']} size={1} />;
      const balance = getItemBalance(swapIn.index);
      const insufficient = swapInput > balance;
      const minOut = applySlippage(swapOutput, SLIPPAGE_BPS);
      const tooSmall = swapOutput > 0 && minOut <= 0;
      const blocked = pool.disabled || swapInput <= 0 || swapOutput <= 0 || insufficient || minOut <= 0;
      return (
        <Section>
          <SideBlock>
            <HeadRow>
              <Text size={0.95}>You're selling</Text>
              <MaxLabel
                onClick={() => {
                  playClick();
                  setSwapInput(balance);
                }}
                title='fill max'
              >
                balance: {balance}
              </MaxLabel>
            </HeadRow>
            <TradeCard>
              <ItemBlock item={swapIn} />
              <AmountBox value={swapInput} set={setSwapInput} max={balance} />
            </TradeCard>
          </SideBlock>

          <FlipRow>
            <FlipButton onClick={flip}>⇅</FlipButton>
          </FlipRow>

          <SideBlock>
            <HeadRow>
              <Text size={0.95}>You're receiving</Text>
              {/* the ACTUAL enforced minimum, not a nominal %: applySlippage
                  floors, so on small quotes the real bound is far looser than
                  1% (a quote of 1 gives minOut 0 = unprotected) */}
              <Text size={0.75} color={tooSmall ? '#b23b3b' : '#999'}>
                min: {minOut} {swapOut.name}
              </Text>
            </HeadRow>
            <TradeCard>
              <ItemBlock item={swapOut} />
              <OutputField>~{swapOutput}</OutputField>
            </TradeCard>
          </SideBlock>

          <Info>
            <Text size={0.72} color='#888'>
              fee {pool.feeBps / 100}% · max slippage {SLIPPAGE_BPS / 100}%
            </Text>
            {tooSmall && (
              <Text size={0.72} color='#b23b3b'>
                ⚠ trade too small to protect from slippage
              </Text>
            )}
          </Info>

          <IconButton
            fullWidth
            scale={2.6}
            color={blocked ? RED : GREEN}
            disabled={blocked}
            onClick={swap}
            text={
              pool.disabled
                ? 'pool disabled'
                : insufficient
                  ? 'insufficient balance'
                  : tooSmall
                    ? 'trade too small'
                    : 'swap'
            }
          />
        </Section>
      );
    };

    const renderLiquidity = () => {
      if (!pool) return <EmptyText text={['No pools available.', 'Check back later!']} size={1} />;
      const sharePct =
        pool.totalSupply > 0 ? ((100 * playerShares) / pool.totalSupply).toFixed(2) : '0';
      const balA = getItemBalance(pool.itemA.index);
      const balB = getItemBalance(pool.itemB.index);
      // adds need BOTH sides at the pool ratio: matched B = quote(A) =
      // A·reserveB/reserveA, so A is capped by balA AND the largest A whose
      // matched B still fits balB
      const maxAByB = pool.reserveB > 0 ? Math.floor((balB * pool.reserveA) / pool.reserveB) : balA;
      const maxAddA = Math.min(balA, maxAByB);
      const addBlocked =
        pool.disabled || sharesMinted <= 0 || addAmountA > balA || addAmountB > balB;
      // a tiny position in a skewed pool can round both outputs to 0; the
      // on-chain remove then reverts, so block it instead of queuing a failing tx
      const zeroRemoveOutput = removeShares > 0 && removeA <= 0 && removeB <= 0;
      const removeBlocked = removeShares <= 0 || removeShares > playerShares || zeroRemoveOutput;
      return (
        <Section>
          <Info>
            <HeadRow>
              <Text size={0.95}>Reserves</Text>
              <Text size={0.75} color='#888'>
                {pool.reserveA} {pool.itemA.name} · {pool.reserveB} {pool.itemB.name}
              </Text>
            </HeadRow>
            <HeadRow>
              <Text size={0.95}>Your shares</Text>
              <Text size={0.75} color='#888'>
                {playerShares} / {pool.totalSupply} ({sharePct}%)
              </Text>
            </HeadRow>
          </Info>

          <Divider />

          <SideBlock>
            <HeadRow>
              <Text size={0.95}>Add liquidity</Text>
              <MaxLabel
                onClick={() => {
                  playClick();
                  setAddAmountA(maxAddA);
                }}
                title='fill max'
              >
                balance: {balA}
              </MaxLabel>
            </HeadRow>
            <TradeCard>
              <ItemBlock item={pool.itemA} />
              <AmountBox value={addAmountA} set={setAddAmountA} max={maxAddA} />
            </TradeCard>
            <TradeCard>
              <ItemBlock item={pool.itemB} />
              <OutputField>+ {addAmountB}</OutputField>
            </TradeCard>
          </SideBlock>
          <Info>
            <Text size={0.72} color='#999'>
              {pool.itemB.name} auto-matched · balance: {balB}
            </Text>
          </Info>
          <IconButton
            fullWidth
            scale={2.6}
            color={addBlocked ? RED : GREEN}
            disabled={addBlocked}
            onClick={addLiquidity}
            text={pool.disabled ? 'pool disabled' : `add liquidity (+${sharesMinted} shares)`}
          />

          {playerShares > 0 && (
            <>
              <Divider />

              <SideBlock>
                <HeadRow>
                  <Text size={0.95}>Remove liquidity</Text>
                  <MaxLabel
                    onClick={() => {
                      playClick();
                      setRemoveShares(playerShares);
                    }}
                    title='fill max'
                  >
                    shares: {playerShares}
                  </MaxLabel>
                </HeadRow>
                <TradeCard>
                  <Text size={0.95}>shares</Text>
                  <AmountBox value={removeShares} set={setRemoveShares} max={playerShares} />
                </TradeCard>
              </SideBlock>
              <Info>
                <Text size={0.72} color='#888'>
                  → {removeA} {pool.itemA.name} + {removeB} {pool.itemB.name}
                </Text>
              </Info>
              <IconButton
                fullWidth
                scale={2.6}
                color={removeBlocked ? RED : GREEN}
                disabled={removeBlocked}
                onClick={removeLiquidity}
                text={
                  removeShares > playerShares
                    ? 'insufficient shares'
                    : zeroRemoveOutput
                      ? 'amount too small'
                      : 'remove liquidity'
                }
              />
            </>
          )}
        </Section>
      );
    };

    return (
      <ModalWrapper
        id='pool'
        header={<ModalHeader title='Item Pools' icon={ItemImages.musu} />}
        canExit
      >
        <Container>
          {renderPicker()}
          {priceInfo && (
            <PriceBanner>
              <PriceHeader>current market value</PriceHeader>
              <PriceRow>
                <PriceSide>
                  <PriceNum>1</PriceNum>
                  <PriceSprite src={priceInfo.item.image} alt={priceInfo.item.name} />
                </PriceSide>
                <PriceEquals>=</PriceEquals>
                <PriceSide>
                  <PriceNum>{fmtPrice(priceInfo.price)}</PriceNum>
                  {priceInfo.unitImage && (
                    <PriceSprite src={priceInfo.unitImage} alt={priceInfo.unitName} />
                  )}
                </PriceSide>
              </PriceRow>
            </PriceBanner>
          )}
          <Tabs>
            <TabButton onClick={() => switchTab('swap')} disabled={tab === 'swap'}>
              Swap
            </TabButton>
            <TabButton
              onClick={() => switchTab('liquidity')}
              disabled={tab === 'liquidity'}
              style={{ borderRight: 'none' }}
            >
              Liquidity
            </TabButton>
          </Tabs>
          {tab === 'swap' ? renderSwap() : renderLiquidity()}
        </Container>
      </ModalWrapper>
    );
  },
};

/////////////////
// SUBCOMPONENTS

// big item sprite + name, fills the left of a trade card. the name font steps
// down for longer names so it fits without truncating (the control on the
// right is fixed-width, sized for a 7-figure amount)
const ItemBlock = ({ item }: { item: Item }) => {
  const len = item.name.length;
  const nameSize = len > 16 ? 0.7 : len > 12 ? 0.8 : len > 9 ? 0.88 : 0.95;
  return (
    <ItemBlockBox>
      <BigSprite src={item.image} alt={item.name} />
      <ItemName style={{ fontSize: `${nameSize}vw` }}>{item.name}</ItemName>
    </ItemBlockBox>
  );
};

// gas-modal-style amount control: centered input flanked by press-and-hold
// steppers, minus on the left and plus on the right. `max` clamps the typed
// value and the +/- steppers so the amount can never exceed what the caller
// computed as executable (see the per-field maxes in the render fns)
const AmountBox = ({
  value,
  set,
  max,
}: {
  value: number;
  set: (n: number) => void;
  max?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const cap = (n: number) => (max !== undefined ? Math.min(n, max) : n);
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
        // clear on focus so a click starts a fresh number from empty instead of
        // editing the existing digits (mirrors the FundOperator gas input)
        onFocus={() => {
          setFocused(true);
          set(0);
        }}
        onBlur={() => setFocused(false)}
        style={{ pointerEvents: 'auto' }}
      />
      <StepButton label='+' onStep={() => set(cap(safeAmt(value + 1)))} />
      {max !== undefined && (
        <MaxChip
          onClick={() => {
            playClick();
            set(max);
          }}
        >
          MAX
        </MaxChip>
      )}
    </AmountRow>
  );
};

/////////////////
// STYLES

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vh;
`;

const Tabs = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.3vw 0.3vw 0 0;
  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
`;

const TabButton = styled.button`
  border: none;
  border-right: solid black 0.15vw;
  padding: 0.5vw;
  flex: 1 1 0;
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: center;
  cursor: pointer;
  &:hover {
    background-color: #ddd;
  }
  &:disabled {
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;

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

// clickable balance/shares readout that fills the paired input to its max
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

  /* never show the blue selection highlight — the field clears on focus and is
     typed fresh, so a selection is only ever visual noise */
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

// read-only output box (receive amount, auto-matched liquidity). narrower than
// the input control on purpose, to give the item block more room
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

const FlipRow = styled.div`
  display: flex;
  justify-content: center;
`;

const FlipButton = styled.button`
  width: 2.1vw;
  height: 2.1vw;
  border: 0.12vw solid #ccc;
  border-radius: 50%;
  background: #fafafa;
  color: #555;
  font-size: 1vw;
  cursor: pointer;
  pointer-events: auto;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: #e8f0fe;
    border-color: #a0c0e8;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4vh;
  padding: 0 0.2vw;
`;

const Divider = styled.div`
  border-top: 0.15vw dashed #ccc;
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
  transition: background 0.12s, border-color 0.12s;
  &:hover {
    background: #e8f0fe;
    border-color: #a0c0e8;
  }
`;

/////////////////
// MARKET PRICE

const PriceBanner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1vh;
  border: 0.12vw solid #e0e0e0;
  border-radius: 0.6vw;
  background: #fafafa;
  padding: 1vw;
`;

const PriceHeader = styled.div`
  font-family: Pixel;
  font-size: 0.72vw;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.12vw;
`;

// full width so the two equal-flex sides pin the "=" to the modal center,
// regardless of how wide the numbers/icons on either side are
const PriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 0.7vw;
  & > *:first-child {
    justify-content: flex-end;
  }
  & > *:last-child {
    justify-content: flex-start;
  }
`;

// each side of the equation: number + icon. equal width so the "=" sits centered
const PriceSide = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45vw;
  flex: 1;
`;

const PriceSprite = styled.img`
  width: 1.9vw;
  height: 1.9vw;
  image-rendering: pixelated;
  user-drag: none;
`;

const PriceEquals = styled.div`
  flex-shrink: 0;
  font-family: Pixel;
  font-size: 1.2vw;
  line-height: 1;
  color: #bbb;
`;

const PriceNum = styled.div`
  font-family: Pixel;
  font-size: 1.5vw;
  line-height: 1;
  color: #222;
`;

/////////////////
// PICKER

const PickerTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6vw;
  width: 100%;
  border: 0.15vw solid black;
  border-radius: 0.5vw;
  background: #fff;
  padding: 0.4vw 0.8vw;
  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background: #f2f2f2;
  }
`;

const PickerLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const Caret = styled.div`
  font-size: 0.8vw;
  color: #666;
`;

const PairIcons = styled.div`
  display: flex;
  align-items: center;
`;

const Sprite = styled.img`
  width: 1.6vw;
  height: 1.6vw;
  image-rendering: pixelated;
  user-drag: none;
  &:not(:first-child) {
    margin-left: -0.4vw;
  }
`;

const PickerList = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 0.15vw solid black;
  border-radius: 0.5vw;
  overflow: hidden;
`;

const PickerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.5vw 0.8vw;
  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background: #f2f2f2;
  }
`;
