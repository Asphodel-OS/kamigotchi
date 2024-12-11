import styled from 'styled-components';

import { ActionButton } from 'app/components/library';

import { EntityID } from '@mud-classic/recs';
import { Commit, canReveal } from 'network/shapes/utils';

interface Props {
  actions: {
    revealTx: (commits: EntityID[]) => Promise<void>;
  };
  data: {
    commits: Commit[];
    blockNumber: number;
  };
  utils: {
    getCommitState: (id: EntityID) => string;
  };
}

export const Commits = (props: Props) => {
  const { actions, data, utils } = props;

  /////////////////
  // LOGIC

  const getCommitTimeFrom = (commit: Commit): string => {
    const secDelta = (data.blockNumber - commit.revealBlock) * 2;

    if (secDelta > 86400) {
      const days = Math.floor(secDelta / 86400);
      const hours = Math.floor((secDelta % 86400) / 3600);
      return `${days} days ${hours} hours ago`;
    } else if (secDelta > 3600) {
      const hours = Math.floor(secDelta / 3600);
      const minutes = Math.floor((secDelta % 3600) / 60);
      return `${hours} hours ${minutes} minutes ago`;
    } else {
      const minutes = Math.floor(secDelta / 60);
      return `${minutes} minutes  ago`;
    }
  };

  /////////////////
  // DISPLAY

  const Cell = (commit: Commit) => {
    return canReveal(commit, data.blockNumber) ? ActiveCell(commit) : ExpiredCell(commit);
  };

  const BottomButton = (commit: Commit) => {
    const state = utils.getCommitState(commit.id);
    let text = 'Reveal';
    if (state === 'REVEALING') text = 'Revealing...';
    else if (state === 'EXPIRED') text = 'Copy ID';

    return (
      <Row>
        <ActionButton
          onClick={
            state === 'EXPIRED'
              ? () => navigator.clipboard.writeText(commit.id)
              : () => actions.revealTx([commit.id])
          }
          text={text}
          disabled={state === 'REVEALING'}
        />
      </Row>
    );
  };

  const ActiveCell = (commit: Commit) => {
    return (
      <CellContainer key={`grid-${commit.id}`} id={`grid-${commit.id}`}>
        {/* <ActiveName>{getCommitTimeFrom(commit)} [Available]</ActiveName> */}
        <ActiveName>Available</ActiveName>
        {BottomButton(commit)}
      </CellContainer>
    );
  };

  const ExpiredCell = (commit: Commit) => {
    return (
      <CellContainer key={`grid-${commit.id}`} id={`grid-${commit.id}`}>
        <ExpiredName>{getCommitTimeFrom(commit)} [Expired]</ExpiredName>
        <Description>
          Your item is stuck, but can be retrieved. <br />
          Please create a support ticket on discord with this commit's ID.
        </Description>
        {BottomButton(commit)}
      </CellContainer>
    );
  };

  return <Container>{data.commits.map((commit) => Cell(commit))}</Container>;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  width: 100%;

  padding: 0.6vw 0.4vw;
  overflow-y: scroll;

  gap: 0.6vh 0.4vw;
`;

const CellContainer = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.4vw;

  padding: 1.2vh 0.8vw;
`;

const ActiveName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0.4vh 0vw;
  color: black;
`;

const ExpiredName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0.4vh 0vw;
  color: red;
`;

const Description = styled.div`
  font-family: Pixel;
  text-align: left;
  font-size: 0.8vw;
  padding: 0.4vh 0.5vw;
  line-height: 1.2vw;
  color: black;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0.1vw 0.5vw;
`;
