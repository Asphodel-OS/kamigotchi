import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { AllyKards } from './AllyKards';
import { EnemyCards } from './EnemyKards';

interface Props {
  account: Account;
  kamis: Kami[];
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, itemIndex: number) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  utils: {
    getOwner: (index: number) => BaseAccount;
  };
}

export const Kards = (props: Props) => {
  const { actions, kamis, account, utils } = props;
  const [ownerCache, _] = useState(new Map<number, BaseAccount>());
  const [allies, setAllies] = useState<Kami[]>([]);
  const [enemies, setEnemies] = useState<Kami[]>([]);

  // identify ally vs enemy kamis whenever the list of kamis changes
  useEffect(() => {
    const allyKamis: Kami[] = [];
    const enemyKamis: Kami[] = [];
    kamis.forEach((kami: Kami) => {
      const owner = getOwner(kami);
      if (account.index === owner.index) allyKamis.push(kami);
      else enemyKamis.push(kami);
    });

    setAllies(allyKamis);
    setEnemies(enemyKamis);
  }, [kamis]);

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
      <AllyKards account={account} kamis={allies} actions={actions} />
      <EnemyCards kamis={enemies} myKamis={allies} ownerCache={ownerCache} actions={actions} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;
