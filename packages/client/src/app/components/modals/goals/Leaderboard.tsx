import { EntityID } from 'engine/recs';
import styled from 'styled-components';

import { useSelected, useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Score } from 'network/shapes/Score';
import { playClick } from 'utils/sounds';

export const Leaderboard = ({
  scores,
  utils,
}: {
  scores: Score[];
  utils: {
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  const { getAccountByID } = utils;
  const accountModalOpen = useVisibility((s) => s.modals.account);
  const setModals = useVisibility((s) => s.setModals);
  const setAccount = useSelected((s) => s.setAccount);

  /////////////////
  // INTERACTION

  // toggle the account modal settings depending on its current state
  const handleClick = (account: Account) => {
    setAccount(account.index);
    if (!accountModalOpen) setModals({ account: true });
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
          <SideText style={{ flexBasis: '20%' }}>{score.value}</SideText>
        </Row>
      );
    });
  };

  return <Container>{Rows(scores)}</Container>;
};

const Container = styled.div`
  margin: 3.5rem 3rem;
  border: solid black 0.15rem;
  border-radius: 0.75rem;

  overflow: auto;
  scroll: auto;
  height: 100%;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1rem;

  &:hover {
    background-color: #eee;
  }
`;

const NameText = styled.p`
  font-size: 1.2rem;
  font-family: Pixel;
  text-align: left;
  color: #333;

  flex-basis: 80%;
  padding: 0 1rem;
`;

const SideText = styled.p`
  font-size: 1.2rem;
  font-family: Pixel;
  text-align: center;
  color: #333;

  flex-basis: 10%;
`;
