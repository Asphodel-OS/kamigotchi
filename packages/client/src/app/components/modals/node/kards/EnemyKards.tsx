import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconListButton } from 'app/components/library';
import { LiquidateButton } from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { ActionIcons } from 'assets/images/icons/actions';
import { kamiIcon } from 'assets/images/icons/menu';
import { healthIcon } from 'assets/images/icons/stats';
import { BaseAccount } from 'network/shapes/Account';
import { Kami, calcHealth, calcHealthPercent, calcOutput } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiCard } from '../KamiCard/KamiCard';

type KamiSort = 'name' | 'health' | 'health %' | 'output' | 'cooldown';

const SortMap: Record<KamiSort, string> = {
  name: kamiIcon,
  health: healthIcon,
  'health %': ActionIcons.liquidate,
  output: ActionIcons.collect,
  cooldown: ActionIcons.harvest,
};

interface Props {
  allies: Kami[];
  enemyEntities: EntityIndex[];
  limit: {
    val: number;
    set: (val: number) => void;
  };
  actions: {
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
    refreshKami: (kami: Kami) => Kami;
    getOwner: (kami: Kami) => BaseAccount;
  };
}

// rendering of enermy kamis on this node
export const EnemyCards = (props: Props) => {
  const { allies, enemyEntities, limit, actions, utils } = props;
  const { getOwner, getKami, refreshKami } = utils;
  const { modals, setModals } = useVisibility();
  const { accountIndex, setAccount } = useSelected();

  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const [enemies, setEnemies] = useState<Kami[]>([]);
  const [sorted, setSorted] = useState<Kami[]>([]);
  const [sort, setSort] = useState<KamiSort>('cooldown');

  // memoized sort options
  const sortOptions = useMemo(
    () =>
      Object.entries(SortMap).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as KamiSort),
      })),
    []
  );

  // set up ticking
  useEffect(() => {
    const timerId = setInterval(() => setLastRefresh(Date.now()), 250);
    return () => clearInterval(timerId);
  }, []);

  // populate the enemy kami data as new ones come in
  useEffect(() => {
    if (!isVisible) return;
    setIsUpdating(true);
    setEnemies(enemyEntities.map((entity) => getKami(entity)));
    setIsUpdating(false);
  }, [isVisible, enemyEntities]); // might need better triggers

  // check to see whether we should refresh each kami's data as needed
  useEffect(() => {
    if (!isVisible || isUpdating) return;
    let enemiesStale = false;
    const newEnemies = enemies.map((kami) => refreshKami(kami));
    for (let i = 0; i < enemies.length; i++) {
      if (newEnemies[i] != enemies[i]) enemiesStale = true;
    }
    if (enemiesStale) setEnemies(newEnemies);
  }, [isVisible, lastRefresh]);

  // sort whenever the list of enemies changes or the sort changes
  useEffect(() => {
    if (!isVisible) return;
    const sorted = [...enemies].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      else if (sort === 'health') return calcHealth(a) - calcHealth(b);
      else if (sort === 'health %') return calcHealthPercent(a) - calcHealthPercent(b);
      else if (sort === 'output') return calcOutput(b) - calcOutput(a);
      else if (sort === 'cooldown') {
        const aCooldown = a.time.cooldown.requirement + a.time.cooldown.last;
        const bCooldown = b.time.cooldown.requirement + b.time.cooldown.last;
        return bCooldown - aCooldown;
      }
      return 0;
    });
    setSorted(sorted);
  }, [enemies, sort]);

  // set visibility whenever modal is closed
  useEffect(() => {
    if (!modals.node) setIsVisible(false);
  }, [modals.node]);

  /////////////////
  // INTERACTION

  const handleToggle = () => {
    playClick();
    if (!isVisible) limit.set(10);
    else limit.set(0); // Reset limit to 0 when toggling
    setIsVisible(!isVisible);
  };

  /////////////////
  // INTERPRETATION

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

  // doing this for a bit of testing sanity
  const getActions = (kami: Kami) => {
    return [LiquidateButton(kami, allies, actions.liquidate)];
  };

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectAccount = (index: number) => {
    if (!modals.account) setModals({ account: true, party: false, map: false });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  return (
    <Container style={{ display: enemyEntities.length > 0 ? 'flex' : 'none' }}>
      <Row>
        <Title
          onClick={handleToggle}
        >{`${isVisible ? '▼' : '▶'} Enemies(${enemyEntities.length})`}</Title>
        <IconListButton img={SortMap[sort]} text={sort} options={sortOptions} radius={0.6} />
      </Row>
      {isVisible &&
        sorted.slice(0, limit.val).map((kami: Kami) => {
          const owner = getOwner(kami);
          return (
            <KamiCard
              key={kami.index}
              kami={kami}
              subtext={`${owner.name} (\$${calcOutput(kami)})`}
              subtextOnClick={() => selectAccount(owner.index)}
              actions={getActions(kami)}
              description={getDescription(kami)}
              showBattery
              showCooldown
            />
          );
        })}
      {limit.val < sorted.length && isVisible && (
        <EmptyText text={['loading more kamis', 'pls be patient..']} size={1} />
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6vw;
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Row = styled.div`
  position: sticky;
  z-index: 1;
  top: 0;

  background-color: white;
  opacity: 0.9;
  width: 100%;

  padding: 0.3vw 0 0.15vw 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-end;
  user-select: none;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  padding: 0.2vw;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;
