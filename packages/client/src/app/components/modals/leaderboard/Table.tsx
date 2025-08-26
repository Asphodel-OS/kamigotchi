import { EntityID } from '@mud-classic/recs';
import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Score } from 'network/shapes/Score';
import { playClick } from 'utils/sounds';

// the table rendering of the leaderboard modal
export const Table = ({
  scores,
  prefix,
  utils,
}: {
  scores: Score[];
  prefix: string;
  utils: {
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  const { getAccountByID } = utils;
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

  const Rows = (scores: Score[]) => {
    return scores.map((score, index) => {
      const account = getAccountByID(score.holderID);
      return (
        <Row key={index} onClick={() => handleClick(account)}>
          <SideText style={{ flexBasis: '10%' }}>{index + 1}</SideText>
          <NameText style={{ flexBasis: '70%' }}>{account.name}</NameText>
          <SideText style={{ flexBasis: '20%' }}>{prefix + score.value}</SideText>
        </Row>
      );
    });
  };

  return <Container>{Rows(scores)}</Container>;
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
