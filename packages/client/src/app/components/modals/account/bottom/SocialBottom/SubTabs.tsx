import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  subTab: string;
  isSelf: boolean;
  setSubTab: (tab: string) => void;
}

export const SubTabs = (props: Props) => {
  // layer on a sound effect
  const setTab = async (tab: string) => {
    playClick();
    props.setSubTab(tab);
  };

  const SelfTabs = () => {
    return (
      <>
        <Button
          onClick={() => setTab('frens')}
          disabled={props.subTab === 'frens'}
          style={{ borderRight: 'solid black .15vw' }}
        >
          Friends
        </Button>
        <Button
          onClick={() => setTab('requests')}
          disabled={props.subTab === 'requests'}
          style={{ borderRight: 'solid black .15vw' }}
        >
          Requests
        </Button>
        <Button onClick={() => setTab('blocked')} disabled={props.subTab === 'blocked'}>
          Blocked
        </Button>
      </>
    );
  };

  const OtherTabs = () => {
    return (
      <>
        <Button
          onClick={() => setTab('frens')}
          disabled={props.subTab === 'frens'}
          style={{ borderRight: 'solid black .15vw' }}
        >
          Friends
        </Button>
        <Button onClick={() => setTab('activity')} disabled={props.subTab === 'activity'}>
          Activity
        </Button>
      </>
    );
  };

  return <Container>{props.isSelf ? SelfTabs() : OtherTabs()}</Container>;
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.3vw 0.3vw 0 0;
  border-bottom: none;

  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Button = styled.button`
  border: solid 0.15vw black;
  border-radius: 0.3vw;
  padding: 0.5vw;
  margin: 0.5vw;
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
