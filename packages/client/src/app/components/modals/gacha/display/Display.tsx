import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Kami } from 'network/shapes/Kami';
import { GachaKami } from 'network/shapes/Kami/types';
import { AuctionMode, Filter, Sort, TabType } from '../types';
import { Pool } from './mint/Pool';
import { Reroll } from './reroll/Reroll';

interface Props {
  controls: {
    limit: number;
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
  };
  state: {
    tab: TabType;
    mode: AuctionMode;
    setMode: (mode: AuctionMode) => void;
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
  const { poolKamis } = data;

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
        return <></>;
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

  overflow-y: scroll;
`;
