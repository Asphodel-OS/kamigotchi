import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { Commit, canReveal } from 'network/shapes/utils';
import { getTimeDeltaString } from 'utils/time';

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_HOUR = 3600;
interface Props {
  actions: {
    revealTx: (commits: Commit[]) => Promise<void>;
  };
  blockNumber: bigint;
  data: {
    commits: Commit[];
  };
}

export const Commits = (props: Props) => {
  const blockNumber = Number(props.blockNumber);

  /////////////////
  // LOGIC

  const getCommitTimeFrom = (commit: Commit): string => {
    const secDelta = (blockNumber - commit.revealBlock) * 2;
    return getTimeDeltaString(secDelta);
  };

  /////////////////
  // DISPLAY

  const Cell = (commit: Commit) => {
    return canReveal(commit, blockNumber) ? ActiveCell(commit) : ExpiredCell(commit);
  };

  const ActiveCell = (commit: Commit) => {
    return (
      <CellContainer key={`grid-${commit.id}`} id={`grid-${commit.id}`}>
        <ActiveName>Available Commit </ActiveName>
        {/* <ActiveName>Available Commit, {getCommitTimeFrom(commit)}</ActiveName> */}
        <Row>
          <ActionButton onClick={() => props.actions.revealTx([commit])} text='Reveal' />
        </Row>
      </CellContainer>
    );
  };

  const ExpiredCell = (commit: Commit) => {
    return (
      <CellContainer key={`grid-${commit.id}`} id={`grid-${commit.id}`}>
        <ExpiredName>Expired Commit, {getCommitTimeFrom(commit)}</ExpiredName>
        <Description>Your kami is stuck, but can be retrieved.</Description>
        <Description> Please send this commit's ID to support on discord.</Description>
        <Row>
          <ActionButton
            onClick={() => {
              navigator.clipboard.writeText(commit.id);
            }}
            text='Copy ID'
          />
        </Row>
      </CellContainer>
    );
  };

  return (
    <OuterBox key='grid'>
      <InnerBox>{props.data.commits.map((commit) => Cell(commit))}</InnerBox>
    </OuterBox>
  );
};

const OuterBox = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
`;

const InnerBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;

  flex: 1;
  border: solid 0.15vw black;
  border-radius: 0.75vw;
  height: 80%;
  padding: 1vw;
  margin: 1vw;
  overflow-y: scroll;

  gap: 1.2vw;
`;

const CellContainer = styled.div`
  border: solid 0.15vw black;
  border-radius: 1vw;

  margin: 0.3vh 0.4vw;
  padding: 1.4vh 0.8vw;
  position: relative;
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
  color: black;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0.1vw 0.5vw;
`;
