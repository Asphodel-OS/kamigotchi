import styled from 'styled-components';

import { useVisibility } from 'app/stores';
import { GACHA_TICKET_INDEX, MUSU_INDEX, REROLL_TICKET_INDEX } from 'constants/items';
import { Commit } from 'network/shapes/Commit';
import { Inventory } from 'network/shapes/Inventory';
import { Item } from 'network/shapes/Item';
import { NullItem } from 'network/shapes/Item/types';
import { BaseKami } from 'network/shapes/Kami/types';
import { useEffect, useState } from 'react';
import { AuctionMode, Filter, Sort, TabType } from '../types';
import { Controls } from './controls/Controls';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  actions: {
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
    limit: number;
    setLimit: (limit: number) => void;
  };
  data: {
    commits: Commit[];
    inventories: Inventory[];
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
  const { actions, data, controls, state, utils } = props;
  const { commits, inventories } = data;
  const { tick, tab, setTab, mode, setMode } = state;
  const { getItem, getGachaBalance, getRerollBalance, getMusuBalance } = utils;
  const { modals } = useVisibility();

  const [payItem, setPayItem] = useState<Item>(NullItem);
  const [balance, setBalance] = useState(0);

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
        setBalance(getMusuBalance(inventories));
      } else if (mode === 'REROLL') {
        setPayItem(getItem(MUSU_INDEX));
        setBalance(0);
      } else setBalance(0);
    }
  }, [tick, tab, mode]);

  return (
    <Container>
      <Tabs tab={tab} setTab={setTab} />
      <Controls
        actions={actions}
        data={{ item: payItem, balance, commits }}
        controls={controls}
        state={state}
      />
      <Footer actions={actions} data={{ item: payItem, balance }} state={state} />
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
