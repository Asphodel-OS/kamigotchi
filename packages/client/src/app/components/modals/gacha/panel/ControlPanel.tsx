import styled from 'styled-components';

import { EmptyText, Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { BaseKami } from 'network/shapes/Kami/types';
import { GachaTicket } from 'network/shapes/utils';
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
        <Overlay right={0.75} bottom={0.3}>
          <Pairing>
            <Text>{gachaBalance.toFixed(1)}</Text>
            <Tooltip text={[GachaTicket.name]}>
              <Icon src={GachaTicket.image} />
            </Tooltip>
          </Pairing>
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

const Pairing = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
  user-select: none;
`;

const Icon = styled.img`
  height: 1.8vw;
  image-rendering: pixelated;
`;

const Text = styled.div`
  height: 1.2vw;
  margin-top: 0.6vw;
  font-size: 1vw;
  color: #333;
`;
