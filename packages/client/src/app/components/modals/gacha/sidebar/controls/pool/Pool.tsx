import styled from 'styled-components';

import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { Filter, Sort, TabType, ViewMode } from '../../../types';
import { PricePanel } from '../PricePanel';
import { KamiPanel } from './KamiPanel';

interface Props {
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
  };
  isVisible: boolean;
}
export const Pool = (props: Props) => {
  const { controls, data, state, isVisible } = props;
  const { mode } = controls;
  const { price, quantity } = state;

  return (
    <Container isVisible={isVisible}>
      <KamiPanel controls={controls} isVisible={mode === 'DEFAULT'} />
      <PricePanel data={data} state={{ price, quantity }} isVisible={mode === 'ALT'} />
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
