import { animate } from 'animejs';
import { Dispatch, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Account, Item, NullItem } from 'network/shapes';
import { ConfirmationData } from '../library/Confirmation';
import { TabType } from '../types';
import { Controls } from './controls';
import { Offers } from './offers/Offers';
import { SearchBar } from './SearchBar';

export const Orderbook = ({
  actions,
  controls,
  data,
  utils,
  isVisible,
}: {
  actions: {
    cancelTrade: (trade: Trade) => void;
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    tab: TabType;
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: {
    account: Account;
    items: Item[];
    trades: Trade[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
  isVisible: boolean;
}) => {
  const { items } = data;

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [sort, setSort] = useState<string>('Price'); // Price, Owner
  const [ascending, setAscending] = useState<boolean>(true);
  const [query, setQuery] = useState<string>('');

  // TODO: consolidate these filters into a single object
  const [itemFilter, setItemFilter] = useState<Item>(NullItem); // item index
  const [typeFilter, setTypeFilter] = useState<TradeType>('Buy');
  const [category, setCategory] = useState<string>('All');

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const to = collapsed ? '0%' : '40%';
    if (!containerRef.current) return;
    animate(containerRef.current, { ['--top' as any]: to, duration: 220, easing: 'easeOutSine' });
  }, [collapsed]);

  return (
    <Container
      ref={containerRef}
      isVisible={isVisible}
      style={{ ['--top' as any]: collapsed ? '0%' : '40%' }}
    >
      <TopPane collapsed={collapsed}>
        <Controls
          controls={{
            typeFilter,
            setTypeFilter,
            sort,
            setSort,
            ascending,
            setAscending,
            itemFilter,
            setItemFilter,
            query,
            setQuery,
            category,
            setCategory,
          }}
          data={data}
        />
      </TopPane>
      <ToggleRow>
        <CollapseToggle onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '∨' : '∧'}
        </CollapseToggle>
      </ToggleRow>
      <SearchBar
        controls={{
          typeFilter,
          setTypeFilter,
          setItemFilter,

          sort,
          setSort,
          ascending,
          setAscending,
          query,
          setQuery,
          setCategory,
        }}
        data={{ items }}
        utils={utils}
      />
      <BottomPane>
        <Offers
          actions={actions}
          controls={{
            ...controls,
            typeFilter,
            sort,
            setSort,
            ascending,
            setAscending,
            itemFilter,
          }}
          data={data}
          utils={utils}
        />
      </BottomPane>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  position: relative;

  flex-flow: column nowrap;
  height: 100%;
  width: 100%;
  user-select: none;
`;

const TopPane = styled.div<{ collapsed: boolean }>`
  display: ${({ collapsed }) => (collapsed ? 'none' : 'flex')};
  position: relative;
  overflow: hidden auto;
  height: 100%;
  width: 100%;
  pointer-events: ${({ collapsed }) => (collapsed ? 'none' : 'auto')};
  background: transparent;
  visibility: ${({ collapsed }) => (collapsed ? 'hidden' : 'visible')};
`;

const BottomPane = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden auto;
  z-index: 0;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

const CollapseToggle = styled.button`
  background: rgb(221, 221, 221);
  border: 0.12vw solid black;
  border-left: 0;
  border-right: 0;
  width: 100%;
  height: 1.2vw;

  font-size: 0.9vw;
  line-height: 1.2vw;
  cursor: pointer;
`;
