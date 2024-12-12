import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useVisibility } from 'app/stores';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { AllyKards } from './AllyKards';
import { EnemyCards } from './EnemyKards';

interface Props {
  account: Account;
  kamiEntities: {
    account: EntityIndex[];
    node: EntityIndex[];
  };
  actions: {
    collect: (kami: Kami) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  display: {
    UseItemButton: (kami: Kami, account: Account) => JSX.Element;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    refreshKami: (kami: Kami) => Kami;
    getOwner: (kami: Kami) => BaseAccount;
  };
}

export const Kards = (props: Props) => {
  const { actions, kamiEntities, account, display, utils } = props;
  const { modals } = useVisibility();
  const containerRef = useRef<HTMLDivElement>(null);

  const [allies, setAllies] = useState<Kami[]>([]);
  const [alliesUpdating, setAlliesUpdating] = useState(false);
  const [allyEntities, setAllyEntities] = useState<EntityIndex[]>([]);
  const [enemyEntities, setEnemyEntities] = useState<EntityIndex[]>([]);
  const [visibleEnemies, setVisibleEnemies] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ticking
  useEffect(() => {
    const timerId = setInterval(() => setLastRefresh(Date.now()), 250);
    return () => clearInterval(timerId);
  }, []);

  // identify ally vs enemy kamis whenever the list of kamis changes
  useEffect(() => {
    const allies: EntityIndex[] = [];
    const enemies: EntityIndex[] = [];
    kamiEntities.node.forEach((entity) => {
      if (kamiEntities.account.includes(entity)) allies.push(entity);
      else enemies.push(entity);
    });
    setAllyEntities(allies);
    setEnemyEntities(enemies);
  }, [kamiEntities]);

  // populate the ally kami data as new ones come in
  useEffect(() => {
    if (!modals.node) return;
    setAlliesUpdating(true);
    setAllies(allyEntities.map((entity) => utils.getKami(entity)));
    setAlliesUpdating(false);
  }, [modals.node, allyEntities]);

  // check to refresh ally data at each interval
  useEffect(() => {
    if (!modals.node || alliesUpdating) return;
    let alliesStale = false;
    const newAllies = allies.map((kami) => utils.refreshKami(kami));
    for (let i = 0; i < allies.length; i++) {
      if (newAllies[i] != allies[i]) alliesStale = true;
    }
    if (alliesStale) setAllies(newAllies);
  }, [modals.node, lastRefresh]);

  // scrolling effects for enemy kards
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [enemyEntities.length, visibleEnemies]);

  /////////////////
  // INTERACTION

  // when scrolling, load more kamis when nearing the bottom of the container
  const handleScroll = () => {
    if (isScrolledToBottom()) {
      const newLimit = Math.min(visibleEnemies + 5, enemyEntities.length);
      if (newLimit != visibleEnemies) setVisibleEnemies(newLimit);
    }
  };

  /////////////////
  // INTERPRETATION

  // check whether the container is scrolled to the bottom
  const isScrolledToBottom = () => {
    const current = containerRef.current;
    if (!current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 20; // 20px threshold
  };

  ///////////////////
  // DISPLAY

  return (
    <Container
      ref={containerRef}
      style={{ display: kamiEntities.node.length > 0 ? 'flex' : 'none' }}
    >
      <AllyKards
        account={account}
        kamis={allies}
        actions={actions}
        display={display}
        utils={utils}
      />
      <EnemyCards
        allies={allies}
        enemyEntities={enemyEntities}
        actions={actions}
        utils={utils}
        limit={{ val: visibleEnemies, set: setVisibleEnemies }}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  overflow-y: auto;
`;
