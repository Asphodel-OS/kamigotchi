import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami';
import { Filter, Sort, TabType, ViewMode } from '../types';
import { AuctionDisplay } from './auction/Auction';
import { Pool } from './mint/Pool';
import { Reroll } from './reroll/Reroll';

interface Props {
  caches: {
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  controls: {
    tab: TabType;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    filters: Filter[];
    sorts: Sort[];
  };
  data: {
    accountEntity: EntityIndex;
    poolKamis: EntityIndex[];
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
  };
  state: {
    setQuantity: (quantity: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (selectedKamis: Kami[]) => void;
    tick: number;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    getAccountKamis: () => Kami[];
    queryGachaKamis: () => EntityIndex[];
  };
}

export const Display = (props: Props) => {
  const { state, controls, data, caches, utils } = props;
  const { tab, mode, setMode } = controls;
  const { auctions, poolKamis } = data;

  const Content = () => {
    switch (tab) {
      case 'AUCTION':
        return (
          <AuctionDisplay
            data={{ auctions: { gacha: auctions.gacha, reroll: auctions.reroll } }}
            state={{ mode, setMode, tab }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <Pool
        controls={controls}
        caches={caches}
        data={{ entities: poolKamis }}
        utils={utils}
        isVisible={tab === 'MINT'}
      />

      <Reroll
        controls={controls}
        data={{ ...data, auction: auctions.reroll }}
        state={state}
        utils={utils}
        isVisible={tab === 'REROLL'}
      />
      {Content()}
    </Container>
  );
};

const Container = styled.div`
  background-color: #beb;
  max-height: 100%;
  width: 100%;
  border-radius: 0 0 0 1.2vw;

  display: flex;
  flex-direction: row;
`;
