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
import { Kami } from 'network/shapes/Kami/types';
import { AuctionMode, Filter, Sort, TabType } from '../types';
import { Controls } from './controls/Controls';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  actions: {
    approve: (payItem: Item, price: number) => void;
    bid: (item: Item, amt: number) => void;
    mint: (balance: number) => Promise<boolean>;
    reroll: (kamis: Kami[]) => Promise<boolean>;
    reveal: (commits: Commit[]) => Promise<void>;
  };
  controls: {
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
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
    quantity: number;
    setQuantity: (quantity: number) => void;
    selectedKamis: Kami[];
    tick: number;
  };
  utils: {
    getItem: (index: number) => Item;
    getGachaBalance: (inventories: Inventory[]) => number;
    getRerollBalance: (inventories: Inventory[]) => number;
    getMusuBalance: (inventories: Inventory[]) => number;
  };
}

export const Sidebar = (props: Props) => {
  const { actions, controls, data, state, utils } = props;
  const { tab, setTab } = controls;
  const { auctions, commits, inventories } = data;
  const { tick, mode, quantity, setQuantity } = state;
  const { getItem, getGachaBalance, getRerollBalance, getMusuBalance } = utils;
  const { balances: tokenBal } = useTokens(); // ERC20
  const { modals } = useVisibility();

  const [payItem, setPayItem] = useState<Item>(NullItem);
  const [saleItem, setSaleItem] = useState<Item>(NullItem);
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(0);

  /////////////////
  // HOOKS

  // on startup it should be set to mint
  useEffect(() => {
    updatePayItem();
    updateBalance();
  }, [modals.gacha]);

  // maybe consider controlling this hook and the one below with a dedicated payItem vs buyItem
  useEffect(() => {
    if (!modals.gacha) return;
    updatePrice();
  }, [tab, mode, quantity, tick]);

  useEffect(() => {
    if (!modals.gacha) return;
    updateBalance();
  }, [tab, mode, tick]);

  useEffect(() => {
    if (!modals.gacha) return;
    updatePayItem();
    updateSaleItem();
  }, [tab, mode]);

  /////////////////
  // STATE

  // update the pay item according to tab/mode
  const updatePayItem = () => {
    if (tab === 'MINT') setPayItem(getItem(GACHA_TICKET_INDEX));
    else if (tab === 'REROLL') setPayItem(getItem(REROLL_TICKET_INDEX));
    else {
      if (mode === 'GACHA') setPayItem(getItem(MUSU_INDEX));
      else if (mode === 'REROLL') setPayItem(getItem(ONYX_INDEX));
    }
  };

  // update the sale item according to tab/mode
  const updateSaleItem = () => {
    if (tab !== 'AUCTION') return;
    if (mode === 'GACHA') setSaleItem(getItem(GACHA_TICKET_INDEX));
    else if (mode === 'REROLL') setSaleItem(getItem(REROLL_TICKET_INDEX));
  };

  // update the balance according to tab/mode
  const updateBalance = () => {
    let newBalance = 0;
    if (tab === 'MINT') newBalance = getGachaBalance(inventories);
    else if (tab === 'REROLL') newBalance = getRerollBalance(inventories);
    else if (tab === 'AUCTION') {
      if (mode === 'GACHA') newBalance = getMusuBalance(inventories);
      else if (mode === 'REROLL') newBalance = tokenBal.get(payItem.address || '')?.balance || 0;
    }

    if (newBalance !== balance) {
      setBalance(newBalance);
    }
  };

  // update the price according to tab/mode
  const updatePrice = () => {
    if (tab != 'AUCTION') setPrice(quantity);
    else if (mode === 'GACHA') setPrice(calcAuctionCost(auctions.gacha, quantity));
    else if (mode === 'REROLL')
      setPrice(toERC20DisplayUnits(calcAuctionCost(auctions.reroll, quantity)));
    else setPrice(0);
  };

  return (
    <Container>
      <Tabs tab={tab} setTab={setTab} />
      <Controls
        actions={actions}
        controls={controls}
        data={{ payItem, saleItem, balance, commits }}
        state={{ ...state, price, setPrice }}
      />
      <Footer
        actions={actions}
        controls={controls}
        data={{ payItem, saleItem, balance }}
        state={{ ...state, price, setPrice }}
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
