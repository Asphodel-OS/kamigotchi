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

  // cached owner lookups
  const getOwner = (kami: Kami) => {
    if (!ownerCache.has(kami.index)) {
      const owner = utils.getOwner(kami.index);
      ownerCache.set(kami.index, owner);
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
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;
