import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { calcHealth, calcHealthPercent, calcOutput, Kami } from 'app/cache/kami';
import { EmptyText, IconListButton, KamiCard } from 'app/components/library';
import { LiquidateButton } from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { ActionIcons } from 'assets/images/icons/actions';
import { CooldownIcon } from 'assets/images/icons/battles';
import { KamiIcon } from 'assets/images/icons/menu';
import { HealthIcon } from 'assets/images/icons/stats';
import { BaseAccount } from 'network/shapes/Account';
import { playClick } from 'utils/sounds';

type KamiSort = 'name' | 'health' | 'health %' | 'output' | 'cooldown';
const REFRESH_INTERVAL = 1000;
const SortMap: Record<KamiSort, string> = {
  name: KamiIcon,
  health: HealthIcon,
  'health %': ActionIcons.liquidate,
  output: ActionIcons.collect,
  cooldown: CooldownIcon,
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
    getKami: (entity: EntityIndex, refresh?: boolean) => Kami;
    getOwner: (kamiEntity: EntityIndex) => BaseAccount;
  };
}

// rendering of enermy kamis on this node
export const EnemyCards = (props: Props) => {
  const { allies, enemyEntities, limit, actions, utils } = props;
  const { getOwner, getKami } = utils;
  const { modals, setModals } = useVisibility();
  const { accountIndex, setAccount, nodeIndex } = useSelected();

  const [isVisible, setIsVisible] = useState(true);
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
    const refreshClock = () => setLastRefresh(Date.now());
    const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
    return () => clearInterval(timerId);
  }, []);

  // populate enemy kami data as the list of entities changes.
  // the purpose of this hook is to incrementally ensure all kamis that belong
  // on the list are on the list over time without creating processing bottlenecks.
  // NOTE: atm we rely on the fact that the list of entities is recreated on each
  // top-level time increment. we might want to consider a better trigger
  useEffect(() => {
    setIsUpdating(true);

    // determine the entities that need to be added and removed
    const newEntitiesSet = new Set(enemyEntities);
    const oldEntitiesSet = new Set(enemies.map((enemy) => enemy.entity));
    const toAdd = newEntitiesSet.difference(oldEntitiesSet);
    const toRemove = oldEntitiesSet.difference(newEntitiesSet);

    // remove the entities that need to be removed
    let newEnemies: Kami[] = [];
    if (toRemove.size != enemies.length) {
      newEnemies = [...enemies];
      for (const entity of toRemove) {
        const index = newEnemies.findIndex((enemy) => enemy.entity === entity);
        if (index != -1) newEnemies.splice(index, 1);
      }
    }

    // allot cycle time to add entities depending on whether the list is visible
    const maxCycleTime = isVisible ? 100 : 50;
    const timeStart = Date.now();
    const iterator = toAdd.values();
    let next = iterator.next();
    while (!next.done && Date.now() - timeStart < maxCycleTime) {
      const kami = getKami(next.value, true);
      newEnemies.push(kami);
      next = iterator.next();
    }
    setEnemies(newEnemies);
    setIsUpdating(false);
  }, [isVisible, enemyEntities]);

  // check to see whether we should refresh each kami's data as needed
  useEffect(() => {
    if (!isVisible || isUpdating) return;
    let enemiesStale = false;
    const newEnemies = enemies.map((kami) => getKami(kami.entity));
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
        const aCooldown = a.time?.cooldown ?? 0;
        const bCooldown = b.time?.cooldown ?? 0;
        return bCooldown - aCooldown;
      }
      return 0;
    });
    setSorted(sorted);
  }, [enemies, sort]);

  // limit the rendered list to 10 whenever we change nodes
  useEffect(() => {
    limit.set(10);
  }, [nodeIndex]);

  /////////////////
  // INTERACTION

  const handleToggle = () => {
    playClick();
    setIsVisible(!isVisible);
  };

  /////////////////
  // INTERPRETATION

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats?.health.total ?? 0}`,
      `Harmony: ${kami.stats?.harmony.total ?? 0}`,
      `Violence: ${kami.stats?.violence.total ?? 0}`,
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
          const owner = getOwner(kami.entity);
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
