import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Auction } from 'network/shapes/Auction';
import { Kami } from 'network/shapes/Kami';
import { GachaKami } from 'network/shapes/Kami/types';
import { AuctionMode, Filter, Sort, TabType } from '../types';
import { AuctionDisplay } from './auction/Auction';
import { Pool } from './mint/Pool';
import { Reroll } from './reroll/Reroll';

interface Props {
  controls: {
    filters: Filter[];
    sorts: Sort[];
  };
  actions: {
    reroll: (kamis: Kami[], price: bigint) => Promise<boolean>;
  };
  caches: {
    kamis: Map<EntityIndex, GachaKami>;
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    accountEntity: EntityIndex;
    poolKamis: EntityIndex[];
    maxRerolls: number;
    balance: bigint;
    auctions: {
      gacha: Auction;
      reroll: Auction;
    };
  };
  state: {
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
    tab: TabType;
  };
  utils: {
    getGachaKami: (entity: EntityIndex) => GachaKami;
    getRerollCost: (kami: Kami) => bigint;
    getAccountKamis: () => Kami[];
  };
}

export const Display = (props: Props) => {
  const { state, controls, actions, data, caches, utils } = props;
  const { tab, mode, setMode } = state;
  const { reroll } = actions;
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
        return <Reroll tab={tab} actions={{ reroll }} data={data} utils={utils} />;
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
