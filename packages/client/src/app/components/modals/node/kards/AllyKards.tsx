import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { CollectButton, FeedButton, StopButton } from 'app/components/library/actions';
import { useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Kami, KamiOptions, calcHealth, calcOutput } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { KamiCard } from '../KamiCard/KamiCard';

interface Props {
  account: Account;
  entities: EntityIndex[]; // ally kami entities
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, itemIndex: number) => void;
    stop: (kami: Kami) => void;
  };
  utils: {
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
    refreshKami: (kami: Kami) => Kami;
  };
}

// rendering of an ally kami on this node
export const AllyKards = (props: Props) => {
  const { actions, utils, entities, account } = props;
  const { getKami, refreshKami } = utils;
  const { collect, feed, stop } = actions;
  const { modals } = useVisibility();

  const [allies, setAllies] = useState<Kami[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // whether updating from entities change
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ticking
  useEffect(() => {
    const timerId = setInterval(() => setLastRefresh(Date.now()), 500);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  // set visibility whenever modal is toggled
  useEffect(() => {
    setIsVisible(modals.node);
  }, [modals.node]);

  // check to see whether we should refresh each kami's data at each interval
  useEffect(() => {
    if (!isVisible || isUpdating) return;
    let alliesStale = false;
    const newAllies = allies.map((kami) => refreshKami(kami));
    for (let i = 0; i < allies.length; i++) {
      if (newAllies[i] != allies[i]) alliesStale = true;
    }
    if (alliesStale) setAllies(newAllies);
  }, [isVisible, lastRefresh]);

  // populate the enemy kami data as new ones come in
  useEffect(() => {
    if (!isVisible) return;
    setIsUpdating(true);
    setAllies(entities.map((entity) => getKami(entity)));
    setIsUpdating(false);
  }, [isVisible, entities.length]);

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health.total}`,
      `Harmony: ${kami.stats.harmony.total}`,
      `Violence: ${kami.stats.violence.total}`,
    ];
    return description;
  };

  return (
    <Container style={{ display: entities.length > 0 ? 'flex' : 'none' }}>
      <Title>Allies</Title>
      {entities.map((entity: EntityIndex) => {
        // TODO: optimize this. dont recompute all kami data indiscriminately
        const kami = utils.getKami(entity, { harvest: true, traits: true });
        return (
          <KamiCard
            key={kami.index}
            kami={kami}
            description={getDescription(kami)}
            subtext={`yours (\$${calcOutput(kami)})`}
            actions={[
              FeedButton(kami, account, feed),
              CollectButton(kami, account, collect),
              StopButton(kami, account, stop),
            ]}
            showBattery
            showCooldown
          />
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6vw;
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  padding: 0.2vw;
  padding-top: 0.8vw;
`;
