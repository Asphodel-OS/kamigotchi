import styled from 'styled-components';

import { Commit } from 'network/shapes/Commit';
import { BaseKami } from 'network/shapes/Kami/types';
import { Filter, Sort, TabType } from '../types';
import { Controls } from './controls/Controls';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
  data: {
    commits: Commit[];
    gachaBalance: number;
    rerollBalance: number;
  };
  actions: {
    mint: (balance: number) => Promise<boolean>;
    reroll: (kamis: BaseKami[], price: bigint) => Promise<boolean>;
    reveal: (commits: Commit[]) => Promise<void>;
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

export const Sidebar = (props: Props) => {
  const { actions, data, controls, tab, setTab } = props;
  const { commits, gachaBalance } = data;

  return (
    <Container>
      <Tabs tab={tab} setTab={setTab} />
      <Controls tab={tab} actions={actions} data={data} controls={controls} />
      <Footer tab={tab} actions={actions} balance={gachaBalance} />
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
