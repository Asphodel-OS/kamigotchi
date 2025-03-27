import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami';
import { AuctionMode, Filter, Sort, TabType } from '../types';
import { AuctionDisplay } from './auction/Auction';
import { Pool } from './mint/Pool';
import { Reroll } from './reroll/Reroll';

interface Props {
  caches: {
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  controls: {
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
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
    setQuantity: (quantity: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (selectedKamis: Kami[]) => void;
    tab: TabType;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    getAccountKamis: () => Kami[];
    queryGachaKamis: () => EntityIndex[];
  };
}

export const Display = (props: Props) => {
  const { state, controls, data, caches, utils } = props;
  const { tab, mode, setMode, setQuantity, selectedKamis, setSelectedKamis } = state;
  const { auctions, poolKamis } = data;

  const Content = () => {
    switch (tab) {
      case 'MINT':
        return (
          <Pool
            controls={controls}
            caches={caches}
            data={{ entities: poolKamis }}
            utils={utils}
            isVisible={true}
          />
        );
      case 'REROLL':
        return (
          <Reroll
            data={data}
            state={{ setQuantity, selectedKamis, setSelectedKamis, tab }}
            utils={utils}
          />
        );
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

  return <Container>{Content()}</Container>;
};

const Container = styled.div`
  background-color: #beb;
  max-height: 100%;
  width: 100%;
  border-radius: 0 0 0 1.2vw;

  display: flex;
  flex-direction: row;
`;
