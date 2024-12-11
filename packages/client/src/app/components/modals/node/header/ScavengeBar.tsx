import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ScavBar, calcScavClaimable } from 'network/shapes/Scavenge';
import { useEffect, useState } from 'react';

const SYNC_TIME = 1500;

interface Props {
  scavBar: ScavBar;
  actions: {
    claim: (scavBar: ScavBar) => void;
  };
  utils: {
    getPoints: () => number;
  };
}

export const ScavengeBar = (props: Props) => {
  const { scavBar, actions, utils } = props;
  const { modals } = useVisibility();
  const [lastSync, setLastSync] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [rolls, setRolls] = useState(0);

  /////////////////
  // SUBSCRIPTION

  // time trigger to use for periodic refreshes
  useEffect(() => {
    update();
    const updateSync = () => setLastSync(Date.now());
    const timerId = setInterval(updateSync, SYNC_TIME);
    return () => clearInterval(timerId);
  }, []);

  // periodically update the number of rolls and points if modal is open
  useEffect(() => {
    if (!modals.node || !scavBar) return;
    update();
  }, [lastSync]);

  // update the stats whenever the scav bar changes
  useEffect(() => update(), [scavBar.index]);

  const update = () => {
    const currPoints = utils.getPoints();
    const claimable = calcScavClaimable(scavBar.cost, currPoints);
    setPoints(currPoints);
    setRolls(claimable);
  };

  /////////////////
  // INTERPRETATION

  const getPercent = () => {
    if (!scavBar) return 0;
    return ((points % scavBar.cost) / scavBar.cost) * 100;
  };

  return (
    <Container>
      <ProgressBar percent={getPercent()}>
        {rolls} rolls + {points % scavBar.cost}/{scavBar.cost}
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
