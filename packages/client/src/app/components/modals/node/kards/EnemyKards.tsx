import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { calcHealth, calcHealthPercent, calcOutput, Kami } from 'app/cache/kami';
import { EmptyText, IconListButton, KamiCard, LiquidateButton } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { ActionIcons } from 'assets/images/icons/actions';
import { CooldownIcon } from 'assets/images/icons/battles';
import { StatIcons } from 'constants/stats';
import { Account, BaseAccount } from 'network/shapes/Account';
import { playClick } from 'utils/sounds';

type KamiSort = 'violence' | 'health' | 'output' | 'cooldown';
const REFRESH_INTERVAL = 1000;
const SortMap: Record<KamiSort, string> = {
  cooldown: CooldownIcon,
  health: ActionIcons.liquidate,
  output: ActionIcons.collect,
  violence: StatIcons.violence,
};

// rendering of enermy kamis on this node
export const EnemyCards = ({
  account,
  allies,
  enemyEntities,
  limit,
  actions,
  display,
  utils,
}: {
  account: Account;
  allies: Kami[];
  enemyEntities: EntityIndex[];
  limit: {
    val: number;
    set: (val: number) => void;
  };
  actions: {
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
  };
  display: {
    CastItemButton: (kami: Kami, account: Account, width?: number) => JSX.Element;
  };
  utils: {
    getKami: (entity: EntityIndex, refresh?: boolean) => Kami;
    getOwner: (kamiEntity: EntityIndex) => BaseAccount;
  };
}) => {
  const { getOwner, getKami } = utils;
  const accountModalOpen = useVisibility((s) => s.modals.account);
  const setModals = useVisibility((s) => s.setModals);
  const accountIndex = useSelected((s) => s.accountIndex);
  const setAccount = useSelected((s) => s.setAccount);
  const nodeIndex = useSelected((s) => s.nodeIndex);

  const [isCollapsed, setIsCollapsed] = useState(true);
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
    const maxCycleTime = isCollapsed ? 50 : 100;
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
  }, [isCollapsed, enemyEntities]);

  // check to see whether we should refresh each kami's data as needed
  useEffect(() => {
    if (isCollapsed || isUpdating) return;
    let enemiesStale = false;
    const newEnemies = enemies.map((kami) => getKami(kami.entity));
    for (let i = 0; i < enemies.length; i++) {
      if (newEnemies[i] != enemies[i]) enemiesStale = true;
    }
    if (enemiesStale) setEnemies(newEnemies);
  }, [isCollapsed, lastRefresh]);

  // sort whenever the list of enemies changes or the sort changes
  useEffect(() => {
    if (isCollapsed) return;
    const sorted = [...enemies].sort((a, b) => {
      if (sort === 'health') return calcHealthPercent(a) - calcHealthPercent(b);
      else if (sort === 'output') return calcOutput(b) - calcOutput(a);
      else if (sort === 'violence') {
        const aViolence = a.stats?.violence.total ?? 0;
        const bViolence = b.stats?.violence.total ?? 0;
        return bViolence - aViolence;
      } else if (sort === 'cooldown') {
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

  const handleCollapseToggle = () => {
    playClick();
    setIsCollapsed(!isCollapsed);
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

  const getActions = (kami: Kami) => {
    const sharedWidth = 2.0;
    return [
      display.CastItemButton(kami, account, sharedWidth),
      LiquidateButton(kami, allies, actions.liquidate, sharedWidth),
    ];
  };

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectAccount = (index: number) => {
    if (!accountModalOpen) setModals({ account: true, party: false, map: false });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  return (
    <Container style={{ display: enemyEntities.length > 0 ? 'flex' : 'none' }}>
      <StickyRow>
        <Title onClick={handleCollapseToggle}>
          {`${isCollapsed ? '▶' : '▼'} Enemies(${enemyEntities.length})`}
        </Title>
        <IconListButton img={SortMap[sort]} text={sort} options={sortOptions} radius={0.6} />
      </StickyRow>
      {!isCollapsed &&
        sorted.slice(0, limit.val).map((kami: Kami) => {
          const owner = getOwner(kami.entity);
          return (
            <KamiCard
              isFriend={account.friends?.friends.some((fren) => fren.target.index === owner.index)}
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
      {limit.val < sorted.length && !isCollapsed && (
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

const StickyRow = styled.div`
  position: sticky;
  z-index: 1;
  top: 0;

  background-color: white;
  opacity: 0.9;
  width: 100%;

  padding: 0.3vw 0 0.3vw 0;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  user-select: none;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;
