import styled from 'styled-components';

import { EmptyText } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { BaseKami } from 'network/shapes/Kami/types';
import { GachaTicket } from 'network/shapes/utils';
import { SideBalance } from '../components/SideBalance';
import { TabType } from '../types';
import { Footer } from './Footer';
import { Tabs } from './Tabs';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
  gachaBalance: number;
  actions: {
    mint: (balance: number) => Promise<void>;
    reroll: (kamis: BaseKami[], price: bigint) => () => Promise<void>;
  };
}

export const ControlPanel = (props: Props) => {
  const { actions, gachaBalance } = props;

  return (
    <Container>
      <Tabs tab={props.tab} setTab={props.setTab} />
      <Controls>
        <EmptyText text={['Filters coming soon™']} size={1} />
        <Overlay right={0.2} bottom={0.5}>
          <SideBalance balance={gachaBalance.toFixed(1)} icon={GachaTicket.image} />
        </Overlay>
      </Controls>
      <Footer tab={props.tab} actions={actions} balance={gachaBalance} />
    </Container>
  );
};

const Container = styled.div`
  border-left: solid black 0.15vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Controls = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
