import { EntityIndex } from 'engine/recs';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getHarvestItem } from 'app/cache/harvest';
import { calcHealthPercent, calcOutput, Kami } from 'app/cache/kami';
import { EmptyText, IconListButton, KamiCard, LiquidateButton } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { ActionIcons } from 'assets/images/icons/actions';
import { CooldownIcon } from 'assets/images/icons/battles';
import { StatIcons } from 'constants/stats';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { playClick } from 'utils/sounds';
import { StatsDisplay } from './StatsDisplay';

type KamiSort = 'violence' | 'health' | 'output' | 'cooldown';
const SortMap: Record<KamiSort, string> = {
  cooldown: CooldownIcon,
  health: ActionIcons.liquidate,
  output: ActionIcons.collect,
  violence: StatIcons.violence,
};

// rendering of enermy kamis on this node
export const EnemyCards = ({
  actions,
  data,
  display,
  state,
  utils,
  tick,
}: {
  actions: {
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
  };
  data: {
    account: Account;
    allies: Kami[];
    enemyEntities: EntityIndex[];
  };
  display: {
    CastItemButton: (kami: Kami, account: Account, width?: number) => JSX.Element;
  };
  state: {
    limit: {
      val: number;
      set: (val: number) => void;
    };
  };
  utils: {
    getKami: (entity: EntityIndex, refresh?: boolean) => Kami;
    getOwner: (kamiEntity: EntityIndex) => BaseAccount;
    getTempBonuses: (kami: Kami) => Bonus[];
  };
  tick: number;
}) => {
  const { liquidate } = actions;
  const { account, allies, enemyEntities } = data;
  const { CastItemButton } = display;
  const { limit } = state;
  const { getOwner, getKami, getTempBonuses } = utils;

  const accountModalOpen = useVisibility((s) => s.modals.account);
  const setModals = useVisibility((s) => s.setModals);
  const accountIndex = useSelected((s) => s.accountIndex);
  const setAccount = useSelected((s) => s.setAccount);
  const nodeIndex = useSelected((s) => s.nodeIndex);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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
  }, [isCollapsed, tick]);

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
  // INTERPRETATION

  // get the harvest balance label for a kami
  const getLabel = (kami: Kami) => {
    const harvestOutput = calcOutput(kami);
    const harvestItem = getHarvestItem(kami.harvest!);
    return { text: `${harvestOutput}`, icon: harvestItem.image };
  };

  // get the owner label for a kami
  const getLabelAlt = (kami: Kami) => {
    const owner = getOwner(kami.entity);
    return {
      text: `${owner.name}`,
      color: getOwnerColor(owner),
      onClick: () => selectAccount(owner.index),
    };
  };

  // get the color of the owner text (e.g. friend, guild, etc)
  const getOwnerColor = (owner: BaseAccount) => {
    const friends = account.friends?.friends ?? [];
    const isFriend = friends.some((fren) => fren.target.index === owner.index);
    return isFriend ? '#1a1' : '#333';
  };

  /////////////////
  // INTERACTION

  const handleCollapseToggle = () => {
    playClick();
    setIsCollapsed(!isCollapsed);
  };

  // toggle the node modal to the selected one
  const selectAccount = (index: number) => {
    if (!accountModalOpen) setModals({ account: true, party: false, map: false });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  /////////////////
  // RENDER

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
          return (
            <KamiCard
              key={kami.index}
              kami={kami}
              actions={[
                CastItemButton(kami, account, 2.0),
                LiquidateButton(kami, allies, liquidate, 2.0),
              ]}
              content={<StatsDisplay kami={kami} />}
              label={getLabel(kami)}
              labelAlt={getLabelAlt(kami)}
              utils={{ getTempBonuses }}
              show={{
                battery: true,
                cooldown: true,
              }}
              tick={tick}
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
  z-index: 2;
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
