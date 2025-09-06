import { Dispatch, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { Trade, TradeType } from 'app/cache/trade';
import { Account, Item, NullItem } from 'network/shapes';
import { ConfirmationData } from '../library/Confirmation';
import { TabType } from '../types';
import { Controls } from './Controls';
import { Offers } from './offers/Offers';
import { animate } from 'animejs';

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
  const { tab } = controls;

  const [sort, setSort] = useState<string>('Price'); // Price, Owner
  const [ascending, setAscending] = useState<boolean>(true);
  const [itemFilter, setItemFilter] = useState<Item>(NullItem); // item index
  const [itemSearch, setItemSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TradeType>('Buy');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const to = collapsed ? '0%' : '40%';
    if (!containerRef.current) return;
    animate(containerRef.current, { ['--top' as any]: to, duration: 220, easing: 'easeOutSine' });
  }, [collapsed]);

  return (
    <Container ref={containerRef} isVisible={isVisible} style={{ ['--top' as any]: collapsed ? '0%' : '40%' }}>
      <LeftPane collapsed={collapsed}>
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
          itemSearch,
          setItemSearch,
          }}
          data={data}
          utils={utils}
        />
      </LeftPane>
      <ToggleRow>
        <CollapseToggle onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '∨' : '∧'}
        </CollapseToggle>
      </ToggleRow>
      <RightPane>
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
          itemSearch,
        }}
        data={data}
        utils={utils}
        />
      </RightPane>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  height: 100%;
  display: ${({ isVisible }) => (isVisible ? 'grid' : 'none')};
  grid-template-rows: var(--top, 40%) min-content 1fr;
  grid-template-columns: 1fr;
  position: relative;
  width: 100%;
  user-select: none;
`;

const LeftPane = styled.div<{ collapsed: boolean }>`
  position: relative;
  grid-row: 1;
  overflow: hidden;
  height: 100%;
  width: 100%;
  pointer-events: ${({ collapsed }) => (collapsed ? 'none' : 'auto')};
  background: transparent;
  visibility: ${({ collapsed }) => (collapsed ? 'hidden' : 'visible')};
`;

const RightPane = styled.div`
  position: relative;
  grid-row: 3;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  z-index: 0;
`;

const ToggleRow = styled.div`
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

const CollapseToggle = styled.button`
  border: 0.12vw solid black;
  border-left: 0;
  border-right: 0;
  width: 100%;
  height: 1.2vw;
  line-height: 1.2vw;
  padding: 0;
  font-size: 0.9vw;
  background: rgb(221, 221, 221);
  cursor: pointer;
`;
