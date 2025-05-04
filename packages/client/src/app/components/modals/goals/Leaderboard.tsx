import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Score } from 'network/shapes/Score';
import { playClick } from 'utils/sounds';

interface Props {
  data: Score[];
}

export const Leaderboard = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { setAccount } = useSelected();

  /////////////////
  // INTERACTION

  // toggle the account modal settings depending on its current state
  const handleClick = (account: Account) => {
    setAccount(account.index);
    if (!modals.account) setModals({ account: true });
    playClick();
  };

  /////////////////
  // DISPLAY

  const Rows = (data: Score[]) => {
    return data.map((entry, index) => (
      <Row key={index} onClick={() => handleClick(entry.account)}>
        <SideText style={{ flexBasis: '10%' }}>{index + 1}</SideText>
        <NameText style={{ flexBasis: '70%' }}>{entry.account.name}</NameText>
        <SideText style={{ flexBasis: '20%' }}>{entry.score}</SideText>
      </Row>
    ));
  };

  return <Container>{Rows(props.data)}</Container>;
};

const Container = styled.div`
  margin: 3.5vh 3vw;
  border: solid black 0.15vw;
  border-radius: 0.75vw;

  overflow: auto;
  scroll: auto;
  height: 100%;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  padding: 1.2vw 1vw;

  &:hover {
    background-color: #eee;
  }
`;

const NameText = styled.p`
  font-size: 1.2vw;
  font-family: Pixel;
  text-align: left;
  color: #333;

  flex-basis: 80%;
  padding: 0 1vw;
`;

const SideText = styled.p`
  font-size: 1.2vw;
  font-family: Pixel;
  text-align: center;
  color: #333;

  flex-basis: 10%;
`;
