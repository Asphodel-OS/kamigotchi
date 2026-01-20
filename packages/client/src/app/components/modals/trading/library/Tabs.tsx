import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TabType } from '../types';

export const Tabs = ({ tab, setTab }: { tab: TabType; setTab: (tab: TabType) => void }) => {
  const handleTabbing = (tab: TabType) => {
    setTab(tab);
    playClick();
  };

  return (
    <Container>
      <Button
        disabled={tab === `Orderbook`}
        onClick={() => handleTabbing(`Orderbook`)}
        style={{ borderRight: 'solid black .15vw' }}
      >
        {`View Orderbook`}
      </Button>
      <Button disabled={tab === `Management`} onClick={() => handleTabbing(`Management`)}>
        {`Manage Orders`}
      </Button>
      <Button
        disabled={tab === `History`}
        onClick={() => handleTabbing(`History`)}
        style={{ borderLeft: 'solid black .15vw' }}
      >
        {`History`}
      </Button>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  user-select: none;
`;

const Button = styled.button`
  border: none;
  border-bottom: solid var(--border-primary, black) 0.15vw;
  padding: 0 0.6vw;

  height: 2.4vw;
  line-height: 2.4vw;
  font-size: 1vw;
  flex-grow: 1;
  background-color: var(--bg-primary, white);
  color: var(--text-primary, black);

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: var(--hover-bg, #ddd);
  }
  &:active {
    background-color: var(--active-bg, #bbb);
  }
  &:disabled {
    background-color: var(--disabled-bg, #bbb);
    cursor: default;
    pointer-events: none;
  }
`;
