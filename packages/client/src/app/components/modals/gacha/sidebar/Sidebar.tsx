import { EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcAuctionCost } from 'app/cache/auction';
import { useVisibility } from 'app/stores';
import { GACHA_TICKET_INDEX, MUSU_INDEX, ONYX_INDEX, REROLL_TICKET_INDEX } from 'constants/items';
import { Auction } from 'network/shapes/Auction';
import { Commit } from 'network/shapes/Commit';
import { Inventory } from 'network/shapes/Inventory';
import { Item, NullItem } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType, ViewMode } from '../types';
import { Controls } from './controls/Controls';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

export const Sidebar = ({
  actions,
  controls,
  data,
  state,
  utils,
}: {
  actions: {
    approve: (payItem: Item, price: number) => void;
    bid: (item: Item, amt: number) => void;
    mintPublic: (amount: number) => void;
    mintWL: () => void;
    pull: (balance: number) => Promise<boolean>;
    reroll: (kamis: Kami[]) => Promise<boolean>;
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
    setTab: (tab: TabType) => void;
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
  state: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (kamis: Kami[]) => void;
    tick: number;
  };
  utils: {
    getItem: (index: number) => Item;
    getItemBalance: (index: number) => number;
    isWhitelisted: (entity: EntityIndex) => boolean;
  };
}) => {
  const { mode, tab, setTab } = controls;
  const { auctions, commits } = data;
  const { tick, quantity, setQuantity } = state;
  const { getItem, getItemBalance } = utils;

  const isModalOpen = useVisibility((s) => s.modals.gacha);

  const [payItem, setPayItem] = useState<Item>(NullItem);
  const [saleItem, setSaleItem] = useState<Item>(NullItem);
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(0);
  const [startTs, setStartTs] = useState<number>(0);

  /////////////////
  // HOOKS

  // update context when changed
  useEffect(() => {
    if (!isModalOpen) return;
    updateItems();
    updateStartTs();
    setQuantity(1); // default to 1 on context switch
  }, [isModalOpen, tab, mode]);

  // maybe consider controlling this hook and the one below with a dedicated payItem vs buyItem
  useEffect(() => {
    if (!isModalOpen) return;
    updatePrice();
  }, [isModalOpen, tab, mode, quantity, tick]);

  useEffect(() => {
    if (!isModalOpen) return;
    updateBalance();
  }, [isModalOpen, payItem, tick]);

  /////////////////
  // STATE

  // update the pay and sale items according to tab/mode
  const updateItems = () => {
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') setPayItem(getItem(GACHA_TICKET_INDEX));
      else if (mode === 'ALT') {
        setPayItem(getItem(MUSU_INDEX));
        setSaleItem(getItem(GACHA_TICKET_INDEX));
      }
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') setPayItem(getItem(REROLL_TICKET_INDEX));
      else if (mode === 'ALT') {
        setPayItem(getItem(ONYX_INDEX));
        setSaleItem(getItem(REROLL_TICKET_INDEX));
      }
    }
  };

  // update the balance according to tab/mode
  const updateBalance = () => {
    let newBalance = 0;
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') newBalance = getItemBalance(GACHA_TICKET_INDEX);
      else if (mode === 'ALT') newBalance = getItemBalance(MUSU_INDEX);
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') newBalance = getItemBalance(REROLL_TICKET_INDEX);
      else if (mode === 'ALT') newBalance = getItemBalance(ONYX_INDEX);
    }

    if (newBalance !== balance) setBalance(newBalance);
  };

  // update the price according to tab/mode
  const updatePrice = () => {
    if (mode === 'DEFAULT') setPrice(quantity);
    else if (mode === 'ALT') {
      let auctionCost = 0;
      if (tab === 'GACHA') auctionCost = calcAuctionCost(auctions.gacha, quantity);
      else if (tab === 'REROLL') auctionCost = calcAuctionCost(auctions.reroll, quantity);
      setPrice(auctionCost);
    }
  };

  // update the start timestamp according to tab/mode
  const updateStartTs = () => {
    if (mode === 'DEFAULT') setStartTs(0);
    else if (mode === 'ALT') {
      if (tab === 'GACHA') setStartTs(auctions.gacha.time.start);
      else if (tab === 'REROLL') setStartTs(auctions.reroll.time.start);
    }
  };

  ////////////////
  // RENDER

  return (
    <Container>
      <Tabs tab={tab} setTab={setTab} />
      <Controls
        actions={actions}
        controls={controls}
        data={{ balance, commits, payItem, saleItem }}
        state={{ ...state, price }}
        utils={utils}
      />
      <Footer
        actions={actions}
        controls={controls}
        data={{ ...data, balance, payItem, saleItem, startTs }}
        state={{ ...state, price, setPrice }}
      />
    </Container>
  );
};

const Container = styled.div`
  border-left: solid black 0.15vw;
  height: 100%;
  width: 32vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;
