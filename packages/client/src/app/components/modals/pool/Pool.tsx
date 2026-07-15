import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getAccount as _getAccount } from 'app/cache/account';
import { getInventoryBalance } from 'app/cache/inventory';
import { ModalWrapper } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useVisibility } from 'app/stores';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
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

const SLIPPAGE_BPS = 100; // 1% tolerance on swaps and liquidity adds

type Tab = 'swap' | 'liquidity';

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

    const pool = useMemo(
      () => pools.find((p) => p.id === poolID) ?? pools[0],
      [pools, poolID]
    );

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
    // RENDERING

    const parseAmount = (raw: string) => {
      const n = Math.floor(Number(raw));
      return isNaN(n) || n < 0 ? 0 : n;
    };

    const renderSwap = () => {
      if (!pool || !swapIn || !swapOut) return <Note>no pools available</Note>;
      const balance = getItemBalance(swapIn.index);
      const insufficient = swapInput > balance;
      return (
        <Section>
          <Row>
            <Label>sell {swapIn.name}</Label>
            <Note>balance: {balance}</Note>
          </Row>
          <Row>
            <Input
              type='number'
              min='0'
              value={swapInput || ''}
              placeholder='0'
              onChange={(e) => setSwapInput(parseAmount(e.target.value))}
            />
            <FlipButton
              onClick={() => {
                setInverted(!inverted); // reset: the amount re-denominates to the other item
                setSwapInput(0);
              }}
            >
              ⇅
            </FlipButton>
          </Row>
          <Row>
            <Label>receive {swapOut.name}</Label>
            <Note>~{swapOutput}</Note>
          </Row>
          <Note>
            rate: 1 {swapIn.name} ≈ {reserveIn > 0 ? (reserveOut / reserveIn).toFixed(4) : '-'}{' '}
            {swapOut.name} · fee: {pool.feeBps / 100}%
          </Note>
          {/* show the ACTUAL enforced minimum, not a nominal %: applySlippage
              floors, so on small quotes the real bound is far looser than 1%
              (a quote of 1 gives minOut 0 = unprotected) */}
          <Note>
            min received: {applySlippage(swapOutput, SLIPPAGE_BPS)} {swapOut.name}
            {swapOutput > 0 && applySlippage(swapOutput, SLIPPAGE_BPS) === 0
              ? ' ⚠ trade too small to protect from slippage'
              : ''}
          </Note>
          <ActionButton
            disabled={
              pool.disabled ||
              swapInput <= 0 ||
              swapOutput <= 0 ||
              insufficient ||
              applySlippage(swapOutput, SLIPPAGE_BPS) <= 0
            }
            onClick={swap}
          >
            {pool.disabled
              ? 'pool disabled'
              : insufficient
                ? 'insufficient balance'
                : swapOutput > 0 && applySlippage(swapOutput, SLIPPAGE_BPS) <= 0
                  ? 'trade too small'
                  : 'swap'}
          </ActionButton>
        </Section>
      );
    };

    const renderLiquidity = () => {
      if (!pool) return <Note>no pools available</Note>;
      return (
        <Section>
          <Row>
            <Label>reserves</Label>
            <Note>
              {pool.reserveA} {pool.itemA.name} · {pool.reserveB} {pool.itemB.name}
            </Note>
          </Row>
          <Row>
            <Label>your shares</Label>
            <Note>
              {playerShares} / {pool.totalSupply} (
              {pool.totalSupply > 0 ? ((100 * playerShares) / pool.totalSupply).toFixed(2) : 0}%)
            </Note>
          </Row>

          <Divider />

          <Row>
            <Label>add {pool.itemA.name}</Label>
            <Note>balance: {getItemBalance(pool.itemA.index)}</Note>
          </Row>
          <Input
            type='number'
            min='0'
            value={addAmountA || ''}
            placeholder='0'
            onChange={(e) => setAddAmountA(parseAmount(e.target.value))}
          />
          <Row>
            <Label>+ {pool.itemB.name} (auto)</Label>
            <Note>
              {addAmountB} (balance: {getItemBalance(pool.itemB.index)})
            </Note>
          </Row>
          <ActionButton
            disabled={
              pool.disabled ||
              sharesMinted <= 0 ||
              addAmountA > getItemBalance(pool.itemA.index) ||
              addAmountB > getItemBalance(pool.itemB.index)
            }
            onClick={addLiquidity}
          >
            {pool.disabled ? 'pool disabled' : `add liquidity (+${sharesMinted} shares)`}
          </ActionButton>

          <Divider />

          <Row>
            <Label>remove shares</Label>
            <Note>
              → {removeA} {pool.itemA.name} + {removeB} {pool.itemB.name}
            </Note>
          </Row>
          <Input
            type='number'
            min='0'
            value={removeShares || ''}
            placeholder='0'
            onChange={(e) => setRemoveShares(parseAmount(e.target.value))}
          />
          <ActionButton
            disabled={removeShares <= 0 || removeShares > playerShares}
            onClick={removeLiquidity}
          >
            {removeShares > playerShares ? 'insufficient shares' : 'remove liquidity'}
          </ActionButton>
        </Section>
      );
    };

    return (
      <ModalWrapper id='pool' header={<Title>Item Pools</Title>} canExit>
        <Container>
          <PoolSelect
            value={pool?.id ?? ''}
            onChange={(e) => {
              setPoolID(e.target.value);
              setSwapInput(0);
              setAddAmountA(0);
              setRemoveShares(0);
            }}
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.itemA.name} / {p.itemB.name}
                {p.disabled ? ' (paused)' : ''}
              </option>
            ))}
          </PoolSelect>
          <Tabs>
            <TabButton active={tab === 'swap'} onClick={() => setTab('swap')}>
              Swap
            </TabButton>
            <TabButton active={tab === 'liquidity'} onClick={() => setTab('liquidity')}>
              Liquidity
            </TabButton>
          </Tabs>
          {tab === 'swap' ? renderSwap() : renderLiquidity()}
        </Container>
      </ModalWrapper>
    );
  },
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9vh;
  padding: 0.9vh;
`;

const Title = styled.div`
  font-size: 1.2vw;
  padding: 0.9vh;
`;

const PoolSelect = styled.select`
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  padding: 0.6vh;
  font-family: Pixel;
  font-size: 0.8vw;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.3vw;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  padding: 0.6vh;
  cursor: pointer;
  font-family: Pixel;
  font-size: 0.8vw;
  background-color: ${({ active }) => (active ? '#111' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#111')};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9vh;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
`;

const Label = styled.div`
  font-size: 0.8vw;
`;

const Note = styled.div`
  font-size: 0.7vw;
  color: #444;
`;

const Divider = styled.div`
  border-top: 0.15vw dashed #999;
`;

const Input = styled.input`
  flex: 1;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  padding: 0.6vh;
  font-family: Pixel;
  font-size: 0.8vw;
`;

const FlipButton = styled.button`
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  padding: 0.6vh 0.9vw;
  cursor: pointer;
  background-color: #fff;
`;

const ActionButton = styled.button`
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  padding: 0.9vh;
  cursor: pointer;
  font-family: Pixel;
  font-size: 0.8vw;
  background-color: #fff;
  &:disabled {
    color: #999;
    border-color: #999;
    cursor: default;
  }
`;
