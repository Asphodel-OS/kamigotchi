import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcAuctionCost } from 'app/cache/auction';
import { useTokens, useVisibility } from 'app/stores';
import { GACHA_TICKET_INDEX, MUSU_INDEX, ONYX_INDEX, REROLL_TICKET_INDEX } from 'constants/items';
import { toERC20DisplayUnits } from 'network/chain';
import { Auction } from 'network/shapes/Auction';
import { Commit } from 'network/shapes/Commit';
import { Inventory } from 'network/shapes/Inventory';
import { Item, NullItem } from 'network/shapes/Item';
import { BaseKami } from 'network/shapes/Kami/types';
import { AuctionMode, Filter, Sort, TabType } from '../types';
import { Controls } from './controls/Controls';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  actions: {
    approve: (payItem: Item, price: number) => void;
    bid: (item: Item, amt: number) => void;
    mint: (balance: number) => Promise<boolean>;
    reroll: (kamis: BaseKami[], price: bigint) => Promise<boolean>;
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
  };
  data: {
    commits: Commit[];
    inventories: Inventory[];
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
  };
  display: {
    TokenButton: (token: Item) => JSX.Element;
  };
  state: {
    tick: number;
    tab: TabType;
    setTab: (tab: TabType) => void;
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
  };
  utils: {
    getItem: (index: number) => Item;
    getGachaBalance: (inventories: Inventory[]) => number;
    getRerollBalance: (inventories: Inventory[]) => number;
    getMusuBalance: (inventories: Inventory[]) => number;
  };
}

export const Sidebar = (props: Props) => {
  const { actions, controls, data, display, state, utils } = props;
  const { auctions, commits, inventories } = data;
  const { tick, tab, setTab, mode, setMode } = state;
  const { getItem, getGachaBalance, getRerollBalance, getMusuBalance } = utils;
  const { balances: tokenBal } = useTokens(); // ERC20
  const { modals } = useVisibility();

  const [payItem, setPayItem] = useState<Item>(NullItem);
  const [saleItem, setSaleItem] = useState<Item>(NullItem);
  const [quantity, setQuantity] = useState(0);
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(0);

  // maybe consider controlling this hook and the one below with a dedicated payItem vs buyItem
  useEffect(() => {
    if (!modals.gacha) return;
    if (tab != 'AUCTION') setPrice(quantity);
    else if (mode === 'GACHA') setPrice(calcAuctionCost(auctions.gacha, quantity));
    else if (mode === 'REROLL')
      setPrice(toERC20DisplayUnits(calcAuctionCost(auctions.reroll, quantity)));
    else setPrice(0);
  }, [tab, mode, quantity, tick]);

  useEffect(() => {
    if (!modals.gacha) return;
    if (tab === 'MINT') {
      setPayItem(getItem(GACHA_TICKET_INDEX));
      setBalance(getGachaBalance(inventories));
    } else if (tab === 'REROLL') {
      setPayItem(getItem(REROLL_TICKET_INDEX));
      setBalance(getRerollBalance(inventories));
    } else {
      // tab === 'AUCTION'
      if (mode === 'GACHA') {
        setPayItem(getItem(MUSU_INDEX));
        setSaleItem(getItem(GACHA_TICKET_INDEX));
        setBalance(getMusuBalance(inventories));
      } else if (mode === 'REROLL') {
        setPayItem(getItem(ONYX_INDEX));
        setSaleItem(getItem(REROLL_TICKET_INDEX));
        setBalance(tokenBal.get(payItem.address || '')?.balance || 0);
      } else setBalance(0);
    }
  }, [tab, mode, tick]);

  return (
    <Container>
      <Tabs tab={tab} setTab={setTab} />
      <Controls
        actions={actions}
        controls={{ ...controls, price, setPrice, quantity, setQuantity }}
        data={{ payItem, saleItem, balance, commits }}
        display={display}
        state={state}
      />
      <Footer
        actions={actions}
        controls={{ ...controls, price, setPrice, quantity, setQuantity }}
        data={{ payItem, saleItem, balance }}
        state={state}
      />
    </Container>
  );
};

const Container = styled.div`
  border-left: solid black 0.15vw;
  height: 100%;
  width: 25vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;
