import styled from 'styled-components';

import { ActionButton } from 'app/components/library';

import { EntityID } from '@mud-classic/recs';
import { Commit, canRevealCommit } from 'network/shapes/Commit';
import { getTimeDeltaString } from 'utils/time';

export const Commits = ({
  actions,
  data,
  utils,
}: {
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
}) => {
  /////////////////
  // LOGIC

  const getCommitTimeFrom = (commit: Commit): string => {
    const secDelta = (data.blockNumber - commit.revealBlock) * 2;
    return getTimeDeltaString(secDelta);
  };

  /////////////////
  // DISPLAY

  const Cell = (commit: Commit) => {
    return canRevealCommit(commit) ? ActiveCell(commit) : ExpiredCell(commit);
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

  padding: 0.6rem 0.4rem;
  overflow-y: scroll;

  gap: 0.6rem 0.4rem;
`;

const CellContainer = styled.div`
  border: solid 0.15rem black;
  border-radius: 0.4rem;

  padding: 1.2rem 0.8rem;
`;

const ActiveName = styled.div`
  font-family: Pixel;
  font-size: 1rem;
  text-align: left;
  justify-content: flex-start;
  padding: 0.4rem 0rem;
  color: black;
`;

const ExpiredName = styled.div`
  font-family: Pixel;
  font-size: 1rem;
  text-align: left;
  justify-content: flex-start;
  padding: 0.4rem 0rem;
  color: red;
`;

const Description = styled.div`
  font-family: Pixel;
  text-align: left;
  font-size: 0.8rem;
  padding: 0.4rem 0.5rem;
  line-height: 1.2rem;
  color: black;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0.1rem 0.5rem;
`;
