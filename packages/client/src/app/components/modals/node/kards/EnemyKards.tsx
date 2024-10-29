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
import { Kami, KamiOptions, calcHealth, calcHealthPercent, calcOutput } from 'network/shapes/Kami';
import { Traits } from 'network/shapes/Trait';
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

// cache for harvest rates of enemy kamis
const KamiCache = new Map<EntityIndex, Kami>();
const KamiLastTs = new Map<EntityIndex, number>(); // kami index -> last update ts
const OwnerCache = new Map<EntityIndex, BaseAccount>();

interface Props {
  limit: {
    val: number;
    set: (val: number) => void;
  };
  entities: {
    allies: EntityIndex[];
    enemies: EntityIndex[];
  };
  actions: {
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
  };
  utils: {
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
    getKamiTraits: (entity: EntityIndex) => Traits;
    getLastTime: (entity: EntityIndex) => number;
    getOwner: (index: number) => BaseAccount;
  };
}

// rendering of enermy kamis on this node
export const EnemyCards = (props: Props) => {
  const { actions, utils, entities, limit } = props;
  const { modals, setModals } = useVisibility();
  const { accountIndex, setAccount } = useSelected();

  const [isVisible, setIsVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const [allies, setAllies] = useState<Kami[]>([]);
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

  // set visibility to skip data pulls
  useEffect(() => {
    if (!modals.node) setIsVisible(false);
  }, [modals.node]);

  // ticking
  useEffect(() => {
    const timerId = setInterval(() => setLastRefresh(Date.now()), 2000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  // populate the ally kami data as new ones come in
  useEffect(() => {
    if (!isVisible) return;
    setAllies(entities.allies.map((entity) => getKami(entity)));
  }, [isVisible, entities.allies.length]);

  // populate the enemy kami data as new ones come in
  useEffect(() => {
    if (!isVisible) return;
    setEnemies(entities.enemies.map((entity) => getKami(entity)));
  }, [isVisible, entities.enemies.length]);

  // check to see whether we should refresh each kami's data as needed
  useEffect(() => {
    if (!isVisible) return;

    // check for ally updates
    let alliesStale = false;
    const newAllies = allies.map((kami) => {
      const lastTime = utils.getLastTime(kami.entityIndex);
      const lastUpdate = KamiLastTs.get(kami.entityIndex)!;
      if (lastTime > lastUpdate) {
        kami = processKami(kami.entityIndex);
        alliesStale = true;
      }
      return kami; // do we need to requery?
    });
    if (alliesStale) setAllies(newAllies);

    // check for enemy updates
    let enemiesStale = false;
    const newEnemies = enemies.map((kami) => {
      const lastTime = utils.getLastTime(kami.entityIndex);
      const lastUpdate = KamiLastTs.get(kami.entityIndex)!;
      if (lastTime > lastUpdate) {
        kami = processKami(kami.entityIndex);
        enemiesStale = true;
      }
      return kami; // do we need to requery?
    });
    if (enemiesStale) {
      setEnemies(newEnemies);
    }
  }, [isVisible, lastRefresh]);

  // sort whenever the list of enemies changes or the sort changes
  useEffect(() => {
    console.log('enemy update detected');
    if (!isVisible) return;
    console.log('sorting enemies');
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

  /////////////////
  // CACHE OPERATIONS

  // get a kami from the cache or live pool
  const getKami = (entity: EntityIndex) => {
    if (!KamiLastTs.has(entity)) processKami(entity, true);
    return KamiCache.get(entity)!;
  };

  // cache any persistent kami data
  const processKami = (entity: EntityIndex, isNew = false) => {
    const kamiOptions = { harvest: true, traits: isNew };
    const kami = utils.getKami(entity, kamiOptions);
    KamiCache.set(entity, kami);
    KamiLastTs.set(entity, kami.time.last);
    return kami;
  };

  /////////////////
  // INTERACTION

  const handleToggle = () => {
    playClick();
    if (!isVisible) limit.set(10); // Reset limit to 10 when toggling
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

  // get and cache owner lookups. if owner is null, update the cache
  const getOwner = (kami: Kami) => {
    const owner = OwnerCache.get(kami.entityIndex);
    if (!owner || !owner.index) {
      const updatedOwner = utils.getOwner(kami.index);
      OwnerCache.set(kami.entityIndex, updatedOwner);
    }
    return OwnerCache.get(kami.entityIndex)!;
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
    <Container style={{ display: entities.enemies.length > 0 ? 'flex' : 'none' }}>
      <Row>
        <Title
          onClick={handleToggle}
        >{`${isVisible ? '▼' : '▶'} Enemies(${entities.enemies.length})`}</Title>
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
