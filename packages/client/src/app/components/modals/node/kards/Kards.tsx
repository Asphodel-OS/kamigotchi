import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami, KamiOptions } from 'network/shapes/Kami';
import { AllyKards } from './AllyKards';
import { EnemyCards } from './EnemyKards';

interface Props {
  account: Account;
  kamis: Kami[];
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
  const { actions, kamis, kamiEntities, account, utils } = props;
  const [ownerCache, _] = useState(new Map<number, BaseAccount>());
  const [allies0, setAllies0] = useState<Kami[]>([]);
  const [enemies0, setEnemies0] = useState<Kami[]>([]);

  const [allies, setAllies] = useState<EntityIndex[]>([]);
  const [enemies, setEnemies] = useState<EntityIndex[]>([]);

  // identify ally vs enemy kamis whenever the list of kamis changes
  useEffect(() => {
    const allyKamis: Kami[] = [];
    const enemyKamis: Kami[] = [];
    kamis.forEach((kami: Kami) => {
      const owner = getOwner(kami);
      if (account.index === owner.index) allyKamis.push(kami);
      else enemyKamis.push(kami);
    });

    setAllies0(allyKamis);
    setEnemies0(enemyKamis);
  }, [kamis]);

  useEffect(() => {
    const allyEntities: EntityIndex[] = [];
    const enemyEntities: EntityIndex[] = [];
    kamiEntities.node.forEach((entity) => {
      const party = kamiEntities.account;
      if (party.includes(entity)) allyEntities.push(entity);
      else enemyEntities.push(entity);
    });
    console.log('counts', allyEntities.length, enemyEntities.length);
    setAllies(allyEntities);
    setEnemies(enemyEntities);
  }, [kamiEntities]);
  /////////////////
  // INTERPRETATION

  // get and cache owner lookups. if owner is null, update the cache
  const getOwner = (kami: Kami) => {
    const owner = ownerCache.get(kami.index);
    if (!owner || !owner.index) {
      const updatedOwner = utils.getOwner(kami.index);
      ownerCache.set(kami.index, updatedOwner);
    }
    return ownerCache.get(kami.index)!;
  };

  ///////////////////
  // DISPLAY

  return (
    <Container style={{ display: kamis.length > 0 ? 'flex' : 'none' }}>
      <AllyKards account={account} entities={allies} actions={actions} utils={utils} />
      <EnemyCards kamis={enemies0} myKamis={allies0} ownerCache={ownerCache} actions={actions} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
