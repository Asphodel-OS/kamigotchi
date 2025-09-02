import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { ActionButton } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ScavBar } from 'network/shapes/Scavenge';
import { useEffect, useState } from 'react';

const SYNC_TIME = 1500;

export const ScavengeBar = ({
  scavenge,
  actions,
  utils,
}: {
  scavenge: ScavBar;
  actions: {
    claim: (scavenge: ScavBar) => void;
  };
  utils: {
    getPoints: (entity: EntityIndex) => number;
    queryScavInstance: () => EntityIndex | undefined;
  };
}) => {
  const { getPoints, queryScavInstance } = utils;
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
    if (!modals.node || !scavenge) return;
    update();
  }, [lastSync, scavenge.index]);

  const update = () => {
    const instanceEntity = queryScavInstance();
    if (!instanceEntity) {
      setRolls(0);
      setPoints(0);
      return;
    }

    const currPoints = getPoints(instanceEntity);
    const rolls = Math.floor(currPoints / scavenge.cost);
    const remainder = currPoints % scavenge.cost;
    setPoints(remainder);
    setRolls(rolls);
  };

  return (
    <Container>
      <ProgressBar percent={(points / scavenge.cost) * 100}>
        {rolls} rolls + {points} / {scavenge.cost}
      </ProgressBar>
      <ActionButton
        onClick={() => actions.claim(scavenge)}
        text={`Scavenge`}
        size='medium'
        disabled={rolls == 0}
      />
    </Container>
  );
};

const Container = styled.div`
  color: black;
  padding: 0.5em 0;
  gap: 0.3em;
  display: flex;
  flex-flow: row;
`;

const ProgressBar = styled.div<{ percent: number }>`
  border: solid black 0.15em;
  border-radius: 0.4em;
  height: 2.2em;
  width: 100%;
  padding: 0.4em 0.8em;

  background: ${({ percent }) =>
    `linear-gradient(90deg, #11ee11, 0%, #11ee11, ${percent}%, #bbb, ${percent}%, #fff 100%)`};

  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Pixel;
  font-size: 0.8em;
  text-align: center;
`;
