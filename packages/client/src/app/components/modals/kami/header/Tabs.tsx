import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TabType } from '../Kami';

interface Props {
  tab: TabType;
  setTab: (tab: TabType) => void;
}

export const Tabs = (props: Props) => {
  const { tab } = props;

  // layer on a sound effect
  const setTab = async (tab: TabType) => {
    playClick();
    props.setTab(tab);
  };

  return (
    <Container>
      <Button
        onClick={() => setTab('TRAITS')}
        disabled={tab === 'TRAITS'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Traits
      </Button>
      <Button
        onClick={() => setTab('SKILLS')}
        disabled={tab === 'SKILLS'}
        style={{ borderRight: 'solid black .15vw' }}
      >
        Skills
      </Button>
      <Button onClick={() => setTab('BATTLES')} disabled={tab === 'BATTLES'}>
        Battles
      </Button>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Button = styled.button`
  border: none;
  padding: 0.5vw;
  flex-grow: 1;
  color: black;
  justify-content: center;

  font-family: Pixel;
  font-size: 1vw;
  text-align: center;

  cursor: pointer;
  pointer-events: auto;
  &:active {
    background-color: #111;
  }
  &:hover {
    background-color: #ddd;
  }
  &:disabled {
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;
