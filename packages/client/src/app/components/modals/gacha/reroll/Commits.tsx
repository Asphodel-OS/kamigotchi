import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { Commit } from 'network/shapes/Commit';

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
  const ActiveCell = (commit: Commit) => {
    return (
      <CellContainer key={`grid-${commit.id}`} id={`grid-${commit.id}`}>
        <ActiveName>Available Commit </ActiveName>
        <Row>
          <ActionButton onClick={() => props.actions.revealTx([commit])} text='Reveal' />
        </Row>
      </CellContainer>
    );
  };

  return (
    <OuterBox key='grid'>
      <InnerBox>{props.data.commits.map((commit) => ActiveCell(commit))}</InnerBox>
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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0.1vw 0.5vw;
`;
