import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

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
    feed: (kami: Kami, itemIndex: number) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    refreshKami: (kami: Kami) => Kami;
    getOwner: (kami: Kami) => BaseAccount;
  };
}

export const Kards = (props: Props) => {
  const { actions, kamiEntities, account, utils } = props;
  const [allies, setAllies] = useState<EntityIndex[]>([]);
  const [enemies, setEnemies] = useState<EntityIndex[]>([]);
  const [visibleEnemies, setVisibleEnemies] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // identify ally vs enemy kamis whenever the list of kamis changes
  useEffect(() => {
    const party = kamiEntities.account;
    const allyEntities: EntityIndex[] = [];
    const enemyEntities: EntityIndex[] = [];

    // separate the list of node kami entities into allies and enemies
    kamiEntities.node.forEach((entity) => {
      if (party.includes(entity)) allyEntities.push(entity);
      else enemyEntities.push(entity);
    });

    setAllies(allyEntities);
    setEnemies(enemyEntities);
  }, [kamiEntities]);

  // scrolling effects for enemy kards
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [enemies.length, visibleEnemies]);

  /////////////////
  // INTERACTION

  // when scrolling, load more kamis when nearing the bottom of the container
  const handleScroll = () => {
    if (isScrolledToBottom()) {
      const newLimit = Math.min(visibleEnemies + 5, enemies.length);
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
      <AllyKards account={account} entities={allies} actions={actions} utils={utils} />
      <EnemyCards
        entities={{ allies, enemies }}
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
