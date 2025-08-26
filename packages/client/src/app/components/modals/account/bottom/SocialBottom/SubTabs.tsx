import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export const SubTabs = ({
  subTab,
  isSelf,
  setSubTab,
}: {
  subTab: string;
  isSelf: boolean;
  setSubTab: (tab: string) => void;
}) => {
  // layer on a sound effect
  const handleSetTab = async (tab: string) => {
    playClick();
    setSubTab(tab);
  };

  const SelfTabs = () => {
    return (
      <>
        <Button
          onClick={() => handleSetTab('frens')}
          disabled={subTab === 'frens'}
          style={{ borderRight: 'solid black .15vw' }}
        >
          Friends
        </Button>
        <Button
          onClick={() => handleSetTab('requests')}
          disabled={subTab === 'requests'}
          style={{ borderRight: 'solid black .15vw' }}
        >
          Requests
        </Button>
        <Button onClick={() => handleSetTab('blocked')} disabled={subTab === 'blocked'}>
          Blocked
        </Button>
      </>
    );
  };

  const OtherTabs = () => {
    return (
      <>
        <Button
          onClick={() => handleSetTab('frens')}
          disabled={subTab === 'frens'}
          style={{ borderRight: 'solid black .15vw' }}
        >
          Friends
        </Button>
        <Button onClick={() => handleSetTab('activity')} disabled={subTab === 'activity'}>
          Activity
        </Button>
      </>
    );
  };

  return <Container>{isSelf ? SelfTabs() : OtherTabs()}</Container>;
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
