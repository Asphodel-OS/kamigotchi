import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useVisibility } from 'app/stores';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Bonus, BonusInstance } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { AllyKards } from './AllyKards';
import { EnemyCards } from './EnemyKards';

export const Kards = ({
  account,
  kamiEntities,
  actions,
  display,
  utils,
}: {
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
    getBonuses: (entity: EntityIndex) => BonusInstance[];
    getKami: (entity: EntityIndex, refresh?: boolean) => Kami;
    getOwner: (kamiEntity: EntityIndex) => BaseAccount;
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}) => {
  const { getKami } = utils;
  const { modals } = useVisibility();
  const containerRef = useRef<HTMLDivElement>(null);

  const [allies, setAllies] = useState<Kami[]>([]);
  const [allyBonuses, setAllyBonuses] = useState<Bonus[][]>([]);
  const [allyEntities, setAllyEntities] = useState<EntityIndex[]>([]);
  const [alliesUpdating, setAlliesUpdating] = useState(false);
  const [enemyEntities, setEnemyEntities] = useState<EntityIndex[]>([]);
  const [visibleEnemies, setVisibleEnemies] = useState(0); // count of visible enemies
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ticking
  useEffect(() => {
    const refreshClock = () => setLastRefresh(Date.now());
    const timerId = setInterval(refreshClock, 2500);
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
    setAllies(allyEntities.map((entity) => getKami(entity, true)));

    setAlliesUpdating(false);
  }, [modals.node, allyEntities]);

  // check to refresh ally data at each interval
  useEffect(() => {
    if (!modals.node || alliesUpdating) return;
    const newAllies = allies.map((ally) => getKami(ally.entity));
    setAllies(newAllies);
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
        account={account}
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
  gap: 0.3em;
`;
