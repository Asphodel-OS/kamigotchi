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
        style={{ borderRight: 'solid black .15rem' }}
      >
        {`View Orderbook`}
      </Button>
      <Button disabled={tab === `Management`} onClick={() => handleTabbing(`Management`)}>
        {`Manage Orders`}
      </Button>
      <Button
        disabled={tab === `History`}
        onClick={() => handleTabbing(`History`)}
        style={{ borderLeft: 'solid black .15rem' }}
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
  border-bottom: solid black 0.15rem;
  padding: 0 0.6rem;

  height: 2.4rem;
  line-height: 2.4rem;
  font-size: 1rem;
  flex-grow: 1;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
  &:disabled {
    background-color: #bbb;
    cursor: default;
    pointer-events: none;
  }
`;
