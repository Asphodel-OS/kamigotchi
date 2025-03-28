import styled from 'styled-components';

import { Kami } from 'network/shapes/Kami';
import { ViewMode } from '../../../types';
import { AuctionPanel } from './AuctionPanel';
import { KamiPanel } from './KamiPanel';

interface Props {
  state: {
    balance: number;
    price: number;
    quantity: number;
    selectedKamis: Kami[];
  };
  mode: ViewMode;
  isVisible: boolean;
}
export const Reroll = (props: Props) => {
  const { state, mode, isVisible } = props;
  const { price, quantity, selectedKamis } = state;

  return (
    <Container isVisible={isVisible}>
      <KamiPanel selectedKamis={selectedKamis} isVisible={isVisible && mode === 'DEFAULT'} />
      <AuctionPanel state={{ price, quantity }} isVisible={isVisible && mode === 'ALT'} />
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
