import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { playClick } from 'utils/sounds';

import { Account } from 'layers/network/shapes/Account';
import { Score } from 'layers/network/shapes/Score';

interface Props {
  data: Score[];
  prefix: string;
}

// the table rendering of the leaderboard modal
export const Table = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { setAccount } = useSelected();

  /////////////////
  // INTERACTION

  // toggle the account modal settings depending on its current state
  const handleClick = (account: Account) => {
    setAccount(account.index);
    if (!modals.account) setModals({ ...modals, account: true });
    playClick();
  };

  /////////////////
  // DISPLAY

  const Rows = (data: Score[]) => {
    return data.map((entry, index) => (
      <Row key={index} onClick={() => handleClick(entry.account)}>
        <SideText style={{ flexBasis: '10%' }}>{index + 1}</SideText>
        <NameText style={{ flexBasis: '70%' }}>{entry.account.name}</NameText>
        <SideText style={{ flexBasis: '20%' }}>{props.prefix + entry.score}</SideText>
      </Row>
    ));
  };

  return <Container>{Rows(props.data)}</Container>;
};

const Container = styled.div`
  margin: 0 1vw;
  border: solid black 0.15vw;
  border-radius: 0.75vw;

  overflow: auto;
  scroll: auto;
  height: 100%;
  margin-bottom: 1vh;
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
