import styled from 'styled-components';

import { BaseKami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType } from '../types';
import { Controls } from './Controls';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
  gachaBalance: number;
  actions: {
    mint: (balance: number) => Promise<boolean>;
    reroll: (kamis: BaseKami[], price: bigint) => () => Promise<void>;
  };
  controls: {
    filters: Filter[];
    setFilters: (filters: Filter[]) => void;
    sorts: Sort[];
    setSorts: (sort: Sort[]) => void;
    limit: number;
    setLimit: (limit: number) => void;
  };
}

export const Panel = (props: Props) => {
  const { actions, gachaBalance, controls } = props;

  return (
    <Container>
      <Tabs tab={props.tab} setTab={props.setTab} />
      <Controls tab={props.tab} controls={controls} />
      <Footer tab={props.tab} actions={actions} balance={gachaBalance} />
    </Container>
  );
};

const Container = styled.div`
  border-left: solid black 0.15vw;
  height: 100%;
  width: 25vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;
