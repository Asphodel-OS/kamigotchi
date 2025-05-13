import styled from 'styled-components';

import { Commit } from 'network/shapes/Commit';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { ViewMode } from '../../../types';
import { PricePanel } from '../PricePanel';
import { KamiPanel } from './KamiPanel';

interface Props {
  controls: {
    mode: ViewMode;
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
    selectedKamis: Kami[];
    tick: number;
  };
  isVisible: boolean;
}
export const Reroll = (props: Props) => {
  const { controls, data, state, isVisible } = props;
  const { mode } = controls;
  const { selectedKamis } = state;

  return (
    <Container isVisible={isVisible}>
      <KamiPanel selectedKamis={selectedKamis} isVisible={isVisible && mode === 'DEFAULT'} />
      <PricePanel data={data} state={state} isVisible={isVisible && mode === 'ALT'} />
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
