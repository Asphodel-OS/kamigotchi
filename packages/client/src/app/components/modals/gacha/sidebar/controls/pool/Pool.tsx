import styled from 'styled-components';

import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { Filter, Sort, TabType, ViewMode } from '../../../types';
import { PricePanel } from '../PricePanel';
import { KamiPanel } from './KamiPanel';

export const Pool = ({
  controls,
  data,
  state,
  isVisible,
}: {
  controls: {
    tab: TabType;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
  };
  data: {
    balance: number;
    commits: Commit[];
    payItem: Item;
    saleItem: Item;
  };
  state: {
    price: number;
    quantity: number;
    tick: number;
  };
  isVisible: boolean;
}) => {
  const { mode } = controls;

  return (
    <Container isVisible={isVisible}>
      <KamiPanel controls={controls} isVisible={mode === 'DEFAULT'} />
      <PricePanel data={data} state={state} isVisible={mode === 'ALT'} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  overflow-y: scroll;
`;
