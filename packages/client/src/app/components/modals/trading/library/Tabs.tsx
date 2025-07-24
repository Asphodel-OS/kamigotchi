import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TabType } from '../types';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export const Tabs = (props: Props) => {
  const { tab, setTab } = props;

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
  border-bottom: solid black 0.15vw;
  padding: 0.6vw;

  font-size: 1.2vw;
  line-height: 1.8vw;
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
