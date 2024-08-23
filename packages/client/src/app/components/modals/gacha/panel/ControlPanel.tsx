import styled from 'styled-components';

import { BaseKami } from 'network/shapes/Kami/types';
import { TabType } from '../types';
import { Tabs } from './Tabs';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
  actions: {
    mint: (balance: number) => () => Promise<void>;
    reroll: (kamis: BaseKami[], price: bigint) => () => Promise<void>;
  };
}

export const ControlPanel = (props: Props) => {
  const { actions } = props;

  return (
    <Container>
      <Tabs tab={props.tab} setTab={props.setTab} />
    </Container>
  );
};

const Container = styled.div`
  background-color: red;
  border-left: solid black 0.15vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;
`;
