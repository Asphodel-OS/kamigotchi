import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { ScavBar, calcScavClaimable } from 'network/shapes/Scavenge';

interface Props {
  scavBar: ScavBar | undefined;
  currPoints: number;
  actions: {
    claim: (scavBar: ScavBar) => void;
  };
}

export const ScavengeBar = (props: Props) => {
  const { scavBar, currPoints, actions } = props;
  if (!scavBar) return <div />;

  const rolls = calcScavClaimable(scavBar.cost, currPoints);

  return (
    <Container>
      <ProgressBar percent={((currPoints % scavBar.cost) / scavBar.cost) * 100}>
        {rolls} rolls + {currPoints % scavBar.cost}/{scavBar.cost}
      </ProgressBar>
      <ActionButton
        onClick={() => actions.claim(scavBar)}
        text={`Scavenge`}
        size='medium'
        disabled={rolls == 0}
      />
    </Container>
  );
};

const Container = styled.div`
  color: black;
  padding: 0.5vh 0;
  gap: 0.3vw;
  display: flex;
  flex-flow: row;
`;

const ProgressBar = styled.div<{ percent: number }>`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  height: 2.2vw;
  width: 100%;
  padding: 0.4vw 0.8vw;

  background: ${({ percent }) =>
    `linear-gradient(90deg, #11ee11, 0%, #11ee11, ${percent}%, #bbb, ${percent}%, #fff 100%)`};

  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Pixel;
  font-size: 0.8vw;
  text-align: center;
`;
