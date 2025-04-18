import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
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

interface Props {
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
}

export const Sidebar = (props: Props) => {
  const { actions, controls, data, state, utils } = props;
  const { mode, tab, setTab } = controls;
  const { auctions, commits, mint } = data;
  const { tick, quantity } = state;
  const { getItem, getItemBalance } = utils;
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
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') setPayItem(getItem(GACHA_TICKET_INDEX));
      if (mode === 'ALT') setPayItem(getItem(MUSU_INDEX));
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') setPayItem(getItem(REROLL_TICKET_INDEX));
      else if (mode === 'ALT') setPayItem(getItem(ONYX_INDEX));
    } else if (tab === 'MINT') setPayItem(getItem(ETH_INDEX));
  };

  // update the sale item according to tab/mode
  const updateSaleItem = () => {
    if (tab === 'GACHA' && mode === 'ALT') setSaleItem(getItem(GACHA_TICKET_INDEX));
    else if (tab === 'REROLL' && mode === 'ALT') setSaleItem(getItem(REROLL_TICKET_INDEX));
    else if (tab === 'MINT') setSaleItem(getItem(ETH_INDEX));
  };

  // update the balance according to tab/mode
  const updateBalance = () => {
    let newBalance = 0;
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') newBalance = getItemBalance(GACHA_TICKET_INDEX);
      else if (mode === 'ALT') newBalance = getItemBalance(MUSU_INDEX);
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') newBalance = getItemBalance(REROLL_TICKET_INDEX);
      else if (mode === 'ALT') newBalance = tokenBal.get(payItem.address || '')?.balance || 0;
    } else if (tab === 'MINT') {
      newBalance = tokenBal.get(payItem.address || '')?.balance || 0;
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
      if (mode === 'DEFAULT') setPrice(quantity);
      else if (mode === 'ALT')
        setPrice(toERC20DisplayUnits(calcAuctionCost(auctions.gacha, quantity)));
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
        data={{ balance, payItem, saleItem }}
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
