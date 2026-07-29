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
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { LpFountainIcon } from 'assets/images/icons/menu';
import { MUSU_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Item } from 'network/shapes/Item';
import {
  applySlippage,
  calcAmountIn,
  calcAmountOut,
  calcRemoveAmounts,
  calcSharesMinted,
  getAllPools,
  getPoolShares,
  Pool,
  quote,
} from 'network/shapes/Pool';
import { playClick, playFund } from 'utils/sounds';
import { PoolPosition, Positions } from './Positions';
import { fmtPrice } from './utils';

const SLIPPAGE_BPS = 100; // 1% tolerance on swaps and liquidity adds

// pastel action colors, shared with the FundOperator modal
const GREEN = '#C2F0C2';
const RED = '#F8D6D6';

// pastel tab colors, shared with the Token Portal tabs
const TAB_BLUE = '#E0EEFF';
const TAB_ORANGE = '#FFF0E0';

type View = 'world' | 'positions';
type Tab = 'swap' | 'liquidity';

// floor to a safe non-negative integer. guards negatives / non-finite so a bad
// amount ("1e999" -> Infinity) can never reach BigInt() downstream
const safeAmt = (v: number) => (!Number.isFinite(v) || v < 0 ? 0 : Math.floor(v));

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
    const [view, setView] = useState<View>('world');
    const [tab, setTab] = useState<Tab>('swap');
    const [lastTick, setLastTick] = useState(Date.now());

    // swap state: itemA -> itemB when !inverted. in a MUSU pool the MUSU->item
    // direction renders as BUY and swapInput denominates the item bought;
    // everywhere else swapInput is the exact amount sold
    const [inverted, setInverted] = useState(false);
    const [swapInput, setSwapInput] = useState(0);

    // liquidity state: addInput denominates the anchor side (the item in a
    // MUSU pool, side A otherwise); the other side is auto-matched via quote
    const [addInput, setAddInput] = useState(0);
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
      setAddInput(0);
      setRemoveShares(0);
      setInverted(false);
    }, [pool?.id]);

    /////////////////
    // INTERPRETATION

    const getItemBalance = (itemIndex: number) =>
      getInventoryBalance(account.inventories ?? [], itemIndex);

    // MUSU pools get currency-native UX: the pool's "subject" is the non-MUSU
    // item, the input always denominates the subject, and the two swap
    // directions read as BUY (pay MUSU) / SELL (receive MUSU)
    const musuIsA = pool?.itemA.index === MUSU_INDEX;
    const musuIsB = pool?.itemB.index === MUSU_INDEX;
    const isMusuPool = !!pool && musuIsA !== musuIsB;

    const swapIn = pool ? (inverted ? pool.itemB : pool.itemA) : undefined;
    const swapOut = pool ? (inverted ? pool.itemA : pool.itemB) : undefined;
    const reserveIn = pool ? (inverted ? pool.reserveB : pool.reserveA) : 0;
    const reserveOut = pool ? (inverted ? pool.reserveA : pool.reserveB) : 0;

    // BUY mode = a MUSU pool swapping MUSU -> item: swapInput is the item
    // amount WANTED (exact-out), and the MUSU cost is derived by inverting the
    // curve. everywhere else swapInput is the exact amount paid in
    const isBuy = isMusuPool && swapIn?.index === MUSU_INDEX;
    const buyCost = pool && isBuy ? calcAmountIn(swapInput, reserveIn, reserveOut, pool.feeBps) : 0;
    const swapOutput = pool ? calcAmountOut(swapInput, reserveIn, reserveOut, pool.feeBps) : 0;
    const execIn = isBuy ? buyCost : swapInput; // amount actually sent as amtIn
    const quotedOut = isBuy ? swapInput : swapOutput; // amount minOut protects

    // liquidity anchor: the item side of a MUSU pool (players add "500 stone",
    // MUSU pairs to it), side A otherwise
    const anchorIsB = isMusuPool && musuIsA;
    const addAmountA = pool
      ? anchorIsB
        ? quote(addInput, pool.reserveB, pool.reserveA)
        : addInput
      : 0;
    const addAmountB = pool
      ? anchorIsB
        ? addInput
        : quote(addInput, pool.reserveA, pool.reserveB)
      : 0;
    const sharesMinted = pool ? calcSharesMinted(pool, addAmountA, addAmountB) : 0;
    const playerShares = pool ? getPoolShares(world, components, pool.id, account.id) : 0;
    const [removeA, removeB] = pool ? calcRemoveAmounts(pool, removeShares) : [0, 0];

    // the player's stake across every pool, for the MY POSITIONS view
    const positions: PoolPosition[] = useMemo(
      () =>
        pools.flatMap((p) => {
          const shares = getPoolShares(world, components, p.id, account.id);
          if (shares <= 0) return [];
          const [amountA, amountB] = calcRemoveAmounts(p, shares);
          const sharePct = p.totalSupply > 0 ? (100 * shares) / p.totalSupply : 0;
          return [{ pool: p, shares, sharePct, amountA, amountB }];
        }),
      [pools, account.id]
    );

    /////////////////
    // ACTIONS

    const swap = () => {
      if (!pool || !swapIn || !swapOut || execIn <= 0 || quotedOut <= 0) return;
      playFund();
      const minOut = applySlippage(quotedOut, SLIPPAGE_BPS);
      actions.add({
        action: 'PoolSwap',
        params: [swapIn.index, swapOut.index, execIn, minOut],
        description: `Swapping ${execIn} ${swapIn.name} for ~${quotedOut} ${swapOut.name}`,
        execute: async () => {
          return api.player.pool.swap(swapIn.index, swapOut.index, execIn, minOut);
        },
      });
    };

    const addLiquidity = () => {
      if (!pool || addAmountA <= 0 || addAmountB <= 0) return;
      playFund();
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
      playFund();
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
      setAddInput(0);
      setRemoveShares(0);
    };

    const switchTab = (t: Tab) => {
      playClick();
      setTab(t);
    };

    const switchView = (v: View) => {
      playClick();
      setView(v);
    };

    // jump from a position card to its pool's liquidity controls. no
    // playClick here: the card's manage IconButton already plays it
    const managePosition = (id: string) => {
      setPoolID(id);
      setSwapInput(0);
      setAddInput(0);
      setRemoveShares(0);
      setView('world');
      setTab('liquidity');
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
        maxHeight={42}
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
      const payBalance = getItemBalance(swapIn.index);
      const insufficient = execIn > payBalance;
      const minOut = applySlippage(quotedOut, SLIPPAGE_BPS);
      const tooSmall = quotedOut > 0 && minOut <= 0;
      // buy mode caps the ask at what the wallet affords AND below the item
      // reserve (the curve can never pay out a full reserve). calcAmountIn
      // overshoots by up to 1, so walk down until the cost actually fits
      let maxInput = isBuy
        ? Math.min(
            calcAmountOut(payBalance, reserveIn, reserveOut, pool.feeBps),
            Math.max(0, reserveOut - 1)
          )
        : payBalance;
      while (
        isBuy &&
        maxInput > 0 &&
        calcAmountIn(maxInput, reserveIn, reserveOut, pool.feeBps) > payBalance
      )
        maxInput--;
      const unfillable = isBuy && swapInput > 0 && buyCost <= 0; // ask >= reserve
      const blocked =
        pool.disabled ||
        swapInput <= 0 ||
        execIn <= 0 ||
        quotedOut <= 0 ||
        insufficient ||
        minOut <= 0;
      // per-item price readout: what this trade actually pays/returns per unit
      const perItem = isBuy
        ? swapInput > 0
          ? buyCost / swapInput
          : 0
        : swapInput > 0
          ? swapOutput / swapInput
          : 0;

      const inputCard = (
        <SideBlock>
          <HeadRow>
            <Text size={0.95}>{isBuy ? `You're buying` : `You're selling`}</Text>
            {isBuy ? (
              /* the ACTUAL enforced minimum, not a nominal %: applySlippage
                  floors, so on small quotes the real bound is far looser than
                  1% (a quote of 1 gives minOut 0 = unprotected) */
              <Text size={0.75} color={tooSmall ? '#b23b3b' : '#999'}>
                min: {minOut} {swapOut.name}
              </Text>
            ) : (
              <Text size={0.75} color='#999'>
                balance: {payBalance}
              </Text>
            )}
          </HeadRow>
          <TradeCard>
            <ItemBlock item={isBuy ? swapOut : swapIn} />
            <AmountBox value={swapInput} set={setSwapInput} max={maxInput} />
          </TradeCard>
        </SideBlock>
      );

      const outputCard = (
        <SideBlock>
          <HeadRow>
            <Text size={0.95}>{isBuy ? `You're paying` : `You're receiving`}</Text>
            {isBuy ? (
              <Text size={0.75} color={insufficient ? '#b23b3b' : '#999'}>
                balance: {payBalance}
              </Text>
            ) : (
              <Text size={0.75} color={tooSmall ? '#b23b3b' : '#999'}>
                min: {minOut} {swapOut.name}
              </Text>
            )}
          </HeadRow>
          <TradeCard>
            <ItemBlock item={isBuy ? swapIn : swapOut} />
            {/* a buy quotes the exact MUSU charged; a sell's return is a ~quote */}
            <OutputField>{isBuy ? `${buyCost}` : `~${swapOutput}`}</OutputField>
          </TradeCard>
        </SideBlock>
      );

      return (
        <Section>
          {inputCard}

          <FlipRow>
            <FlipButton onClick={flip}>⇅</FlipButton>
          </FlipRow>

          {outputCard}

          <Info>
            <Text size={0.72} color='#888'>
              fee {pool.feeBps / 100}% · max slippage {SLIPPAGE_BPS / 100}%
              {perItem > 0
                ? ` · ~${fmtPrice(perItem)} ${isBuy ? swapIn.name : swapOut.name} each`
                : ''}
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
                : unfillable
                  ? 'not enough in the pool'
                  : insufficient
                    ? 'insufficient balance'
                    : tooSmall
                      ? 'trade too small'
                      : isBuy
                        ? 'buy'
                        : isMusuPool
                          ? 'sell'
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
      // the typed side is the anchor (the item in a MUSU pool, A otherwise);
      // the other side auto-matches at the pool ratio. adds need BOTH sides,
      // so the anchor is capped by its own balance AND the largest anchor
      // whose matched amount still fits the other balance
      const anchorItem = anchorIsB ? pool.itemB : pool.itemA;
      const matchedItem = anchorIsB ? pool.itemA : pool.itemB;
      const anchorBal = anchorIsB ? balB : balA;
      const matchedBal = anchorIsB ? balA : balB;
      const anchorReserve = anchorIsB ? pool.reserveB : pool.reserveA;
      const matchedReserve = anchorIsB ? pool.reserveA : pool.reserveB;
      const matchedAmount = anchorIsB ? addAmountA : addAmountB;
      const maxByMatched =
        matchedReserve > 0 ? Math.floor((matchedBal * anchorReserve) / matchedReserve) : anchorBal;
      const maxAdd = Math.min(anchorBal, maxByMatched);
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
              <Text size={0.75} color='#999'>
                balance: {anchorBal}
              </Text>
            </HeadRow>
            <TradeCard>
              <ItemBlock item={anchorItem} />
              <AmountBox value={addInput} set={setAddInput} max={maxAdd} />
            </TradeCard>
            <TradeCard>
              <ItemBlock item={matchedItem} />
              <OutputField>+ {matchedAmount}</OutputField>
            </TradeCard>
          </SideBlock>
          <Info>
            <Text size={0.72} color='#999'>
              {matchedItem.name} auto-matched · balance: {matchedBal}
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
                  <Text size={0.75} color='#999'>
                    shares: {playerShares}
                  </Text>
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
        header={<ModalHeader title='Item Pools' icon={LpFountainIcon} />}
        canExit
        showScrollBar
      >
        <Container>
          <Tabs>
            <TabButton
              $color={TAB_BLUE}
              $active={view === 'world'}
              onClick={() => switchView('world')}
              disabled={view === 'world'}
            >
              World Pools
            </TabButton>
            <TabButton
              $color={TAB_ORANGE}
              $active={view === 'positions'}
              onClick={() => switchView('positions')}
              disabled={view === 'positions'}
              style={{ borderRight: 'none' }}
            >
              My Positions
            </TabButton>
          </Tabs>
          {view === 'positions' ? (
            <Positions positions={positions} onManage={managePosition} />
          ) : (
            <>
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
                <TabButton
                  $color={TAB_BLUE}
                  $active={tab === 'swap'}
                  onClick={() => switchTab('swap')}
                  disabled={tab === 'swap'}
                >
                  Swap
                </TabButton>
                <TabButton
                  $color={TAB_ORANGE}
                  $active={tab === 'liquidity'}
                  onClick={() => switchTab('liquidity')}
                  disabled={tab === 'liquidity'}
                  style={{ borderRight: 'none' }}
                >
                  Liquidity
                </TabButton>
              </Tabs>
              {tab === 'swap' ? renderSwap() : renderLiquidity()}
            </>
          )}
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

// pastel active-fill tabs, same design as the Token Portal's
const TabButton = styled.button<{ $color: string; $active: boolean }>`
  border: none;
  border-right: solid black 0.15vw;
  padding: 0.5vw;
  flex: 1 1 0;
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: center;
  cursor: pointer;
  background-color: ${({ $active, $color }) => ($active ? $color : 'white')};
  &:hover {
    background-color: ${({ $color }) => $color}88;
  }
  &:disabled {
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

  transition:
    background 0.12s,
    border-color 0.12s;
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
  transition:
    background 0.12s,
    border-color 0.12s;
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
