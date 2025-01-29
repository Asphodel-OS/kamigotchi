import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { Commit } from 'network/shapes/Commit';
import { Kami } from 'network/shapes/Kami';
import { GachaKami } from 'network/shapes/Kami/types';
import { Reroll } from '../reroll/Reroll';
import { Filter, Sort, TabType } from '../types';
import { Pool } from './Pool';

interface Props {
  tab: TabType;
  blockNumber: bigint;
  controls: {
    limit: number;
    filters: Filter[];
    sorts: Sort[];
  };
  actions: {
    handleReroll: (kamis: Kami[], price: bigint) => Promise<void>;
    revealTx: (commits: Commit[]) => Promise<void>;
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
  utils: {
    getGachaKami: (entity: EntityIndex) => GachaKami;
    getRerollCost: (kami: Kami) => bigint;
    getAccountKamis: () => Kami[];
  };
}

export const MainDisplay = (props: Props) => {
  const { tab, controls, actions, data, caches, utils } = props;
  const { handleReroll, revealTx } = actions;
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
        return <Reroll tab={tab} actions={{ handleReroll }} data={data} utils={utils} />;
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
