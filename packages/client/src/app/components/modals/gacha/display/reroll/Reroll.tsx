import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { ActionButton, Overlay } from 'app/components/library';
import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami';
import { TabType, ViewMode } from '../../types';
import { AuctionView } from './AuctionView';
import { KamiView } from './KamiView';

interface Props {
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
  };
  data: {
    accountEntity: EntityIndex;
    auction: Auction;
  };
  isVisible: boolean;
  state: {
    setQuantity: (balance: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (selectedKamis: Kami[]) => void;
    tick: number;
  };
  utils: {
    getAccountKamis: () => Kami[];
  };
}

export const Reroll = (props: Props) => {
  const { controls, data, isVisible, state, utils } = props;
  const { mode, setMode } = controls;
  const { auction } = data;

  const toggleMode = () => {
    if (mode === 'DEFAULT') setMode('ALT');
    else setMode('DEFAULT');
  };

  const getButtonText = () => {
    if (mode === 'DEFAULT') return 'Get More Reroll Tickets';
    else return 'Back to Reroll';
  };

  return (
    <Container isVisible={isVisible}>
      <KamiView
        data={data}
        state={state}
        utils={utils}
        isVisible={isVisible && mode === 'DEFAULT'}
      />
      <AuctionView auction={auction} isVisible={isVisible && mode === 'ALT'} />
      <Overlay bottom={0.9} right={0.6}>
        <ActionButton text={getButtonText()} onClick={toggleMode} />
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;

  overflow-y: scroll;
`;
