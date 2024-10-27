import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami, KamiOptions } from 'network/shapes/Kami';
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
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
    getOwner: (index: number) => BaseAccount;
  };
}

export const Kards = (props: Props) => {
  const { actions, kamiEntities, account, utils } = props;
  const [allies, setAllies] = useState<EntityIndex[]>([]);
  const [enemies, setEnemies] = useState<EntityIndex[]>([]);

  // identify ally vs enemy kamis whenever the list of kamis changes
  useEffect(() => {
    const allyEntities: EntityIndex[] = [];
    const enemyEntities: EntityIndex[] = [];
    kamiEntities.node.forEach((entity) => {
      const party = kamiEntities.account;
      if (party.includes(entity)) allyEntities.push(entity);
      else enemyEntities.push(entity);
    });
    setAllies(allyEntities);
    setEnemies(enemyEntities);
  }, [kamiEntities]);

  ///////////////////
  // DISPLAY

  return (
    <Container style={{ display: kamiEntities.node.length > 0 ? 'flex' : 'none' }}>
      <AllyKards account={account} entities={allies} actions={actions} utils={utils} />
      <EnemyCards entities={{ allies, enemies }} actions={actions} utils={utils} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
