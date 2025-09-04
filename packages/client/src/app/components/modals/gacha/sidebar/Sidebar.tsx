import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcAuctionCost } from 'app/cache/auction';
import { GachaMintConfig } from 'app/cache/config';
import { useTokens, useVisibility } from 'app/stores';
import {
  ETH_INDEX,
  GACHA_TICKET_INDEX,
  MUSU_INDEX,
  ONYX_INDEX,
  REROLL_TICKET_INDEX,
} from 'constants/items';
import { toERC20DisplayUnits } from 'network/chain';
import { Auction } from 'network/shapes/Auction';
import { Commit } from 'network/shapes/Commit';
import { GachaMintData } from 'network/shapes/Gacha';
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
    mint: {
      config: GachaMintConfig;
      data: {
        account: GachaMintData;
        gacha: GachaMintData;
      };
      whitelisted: boolean;
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
  const { auctions, commits, mint } = data;
  const { tick, quantity, setQuantity } = state;
  const { getItem, getItemBalance } = utils;
  const { balances: tokenBal } = useTokens(); // ERC20
  const gachaModalVisible = useVisibility((s) => s.modals.gacha);

  const [payItem, setPayItem] = useState<Item>(NullItem);
  const [saleItem, setSaleItem] = useState<Item>(NullItem);
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(0);

  /////////////////
  // HOOKS

  // update context when changed
  useEffect(() => {
    if (!gachaModalVisible) return;
    updatePayItem();
    updateSaleItem();
    setQuantity(1); // default to 1 on context switch
  }, [gachaModalVisible, tab, mode]);

  // maybe consider controlling this hook and the one below with a dedicated payItem vs buyItem
  useEffect(() => {
    if (!gachaModalVisible) return;
    updatePrice();
  }, [gachaModalVisible, tab, mode, quantity, tick]);

  useEffect(() => {
    if (!gachaModalVisible) return;
    updateBalance();
  }, [gachaModalVisible, payItem, tick]);

  /////////////////
  // STATE

  // update the pay item according to tab/mode
  const updatePayItem = () => {
    if (tab === 'MINT') setPayItem(getItem(ETH_INDEX));
    else if (tab === 'GACHA') {
      if (mode === 'DEFAULT') setPayItem(getItem(GACHA_TICKET_INDEX));
      if (mode === 'ALT') setPayItem(getItem(MUSU_INDEX));
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') setPayItem(getItem(REROLL_TICKET_INDEX));
      else if (mode === 'ALT') setPayItem(getItem(ONYX_INDEX));
    }
  };

  // update the sale item according to tab/mode
  const updateSaleItem = () => {
    if (tab === 'GACHA' && mode === 'ALT') setSaleItem(getItem(GACHA_TICKET_INDEX));
    else if (tab === 'REROLL' && mode === 'ALT') setSaleItem(getItem(REROLL_TICKET_INDEX));
    else if (tab === 'MINT') setSaleItem(getItem(GACHA_TICKET_INDEX));
  };

  // update the balance according to tab/mode
  const updateBalance = () => {
    let newBalance = 0;
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') newBalance = getItemBalance(GACHA_TICKET_INDEX);
      else if (mode === 'ALT') newBalance = getItemBalance(MUSU_INDEX);
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') newBalance = getItemBalance(REROLL_TICKET_INDEX);
    } else if (tab === 'MINT') {
      newBalance = 0;
    }

    if (newBalance !== balance) setBalance(newBalance);
  };

  // update the price according to tab/mode
  const updatePrice = () => {
    if (mode === 'DEFAULT') setPrice(quantity);
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') setPrice(quantity);
      else if (mode === 'ALT') {
        const auctionCost = calcAuctionCost(auctions.gacha, quantity);
        setPrice(auctionCost);
      }
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') setPrice(quantity);
      else if (mode === 'ALT') {
        const rawAuctionCost = calcAuctionCost(auctions.reroll, quantity);
        const formattedAuctionCost = toERC20DisplayUnits(rawAuctionCost);
        setPrice(formattedAuctionCost);
      }
    } else if (tab === 'MINT') {
      if (mode === 'DEFAULT') {
        const rawPrice = quantity * mint.config.whitelist.price;
        const formattedPrice = toERC20DisplayUnits(rawPrice);
        setPrice(formattedPrice);
      } else if (mode === 'ALT') {
        const rawPrice = quantity * mint.config.public.price;
        const formattedPrice = toERC20DisplayUnits(rawPrice);
        setPrice(formattedPrice);
      }
    }
  };

  return (
    <Container>
      <Tabs tab={tab} setTab={setTab} />
      <Controls
        actions={actions}
        controls={controls}
        data={{ balance, commits, payItem, saleItem, mint }}
        state={{ ...state, price }}
        utils={utils}
      />
      <Footer
        actions={actions}
        controls={controls}
        data={{ ...data, balance, payItem, saleItem }}
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
