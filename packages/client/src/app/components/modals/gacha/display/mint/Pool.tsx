import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Overlay, Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { KamiStats } from 'network/shapes/Kami';
import { BaseKami, Kami } from 'network/shapes/Kami/types';
import { playClick } from 'utils/sounds';
import { Filter, Sort } from '../../types';
import { KamiBlock } from '../KamiBlock';

const LOADING_TEXT = ['your gacha pool is loading', 'please be patient'];

interface Props {
  controls: {
    sorts: Sort[];
    filters: Filter[];
  };
  caches: {
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    entities: EntityIndex[];
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
  };
  isVisible: boolean;
}

export const Pool = (props: Props) => {
  const { controls, caches, data, utils, isVisible } = props;
  const { filters, sorts } = controls;
  const { kamiBlocks } = caches;
  const { entities } = data;
  const { getKami } = utils;
  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();
  const containerRef = useRef<HTMLDivElement>(null);

  const [filtered, setFiltered] = useState<Kami[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [limit, setLimit] = useState(20);

  // filter (and implicitly populate) the pool of kamis on initial load
  useEffect(() => {
    filterKamis();
    setLoaded(true);
    console.log(`gacha pool loaded: ${entities.length} initial kamis`);
  }, []);

  // when the entities or filters change, update the list of filtered kamis
  useEffect(() => {
    const isOpen = modals.gacha && isVisible;
    if (isOpen) filterKamis();
  }, [filters, entities.length]);

  // scrolling effects for enemy kards
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [filtered.length, limit, modals.gacha]);

  //////////////////
  // INTERACTION

  // when scrolling, load more kamis when nearing the bottom of the container
  const handleScroll = () => {
    if (isScrolledToBottom()) {
      const newLimit = Math.min(limit + 20, filtered.length);
      if (newLimit != limit) setLimit(newLimit);
    }
  };

  const kamiOnClick = (kami: BaseKami) => {
    const sameKami = kamiIndex === kami.index;
    if (!sameKami) setKami(kami.index);
    if (modals.kami && sameKami) setModals({ kami: false });
    else setModals({ gacha: true, kami: true, party: true });
    playClick();
  };

  //////////////////
  // INTERPRETATION

  // check whether the container is scrolled to the bottom
  const isScrolledToBottom = () => {
    const current = containerRef.current;
    if (!current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollTop + clientHeight >= scrollHeight - 10; // 20px threshold
  };

  // get the react component of a KamiBlock displayed in the pool
  const getKamiBlock = (kami: Kami) => {
    const entity = kami.entity;
    if (!kamiBlocks.has(entity)) {
      let tooltip: string[] = [];
      if (kami.stats) {
        tooltip = [
          `Health: ${kami.stats.health.total}(+${kami.stats.health.shift})`,
          `Power: ${kami.stats.power.total}(+${kami.stats.power.shift})`,
          `Violence: ${kami.stats.violence.total}(+${kami.stats.violence.shift})`,
          `Harmony: ${kami.stats.harmony.total}(+${kami.stats.harmony.shift})`,
          `Slots: ${kami.stats.slots.total}(+${kami.stats.slots.shift})`,
        ];
      }

      kamiBlocks.set(
        entity,
        <Tooltip key={kami.index} text={tooltip}>
          <KamiBlock key={kami.index} kami={kami} onClick={() => kamiOnClick(kami)} />
        </Tooltip>
      );
    }
    return kamiBlocks.get(entity)!;
  };

  //////////////////
  // ORGANIZATION

  const filterKamis = () => {
    const all = entities.map((entity) => getKami(entity));
    const newFiltered = all.filter((kami) => {
      return filters.every((filter) => {
        const max = filter.max;
        const min = filter.min;

        if (filter.field === 'INDEX') {
          const index = kami.index;
          return index >= min && index <= max;
        } else if (filter.field === 'LEVEL') {
          const level = kami.progress?.level;
          if (!level) return false;
          return level >= min && level <= max;
        } else {
          const stats = kami?.stats;
          if (!stats) return false;
          const value = stats[filter.field.toLowerCase() as keyof KamiStats].total;
          return value >= min && value <= max;
        }
      });
    });

    setFiltered(newFiltered);
  };

  const sortKamis = (kamis: Kami[]) => {
    const sorted = [...kamis].sort((a, b) => {
      for (let i = 0; i < sorts.length; i++) {
        const sort = sorts[i];
        const field = sort.field.toLowerCase();
        const direction = sort.ascending ? 1 : -1;

        let aStat = 0;
        let bStat = 0;
        if (field === 'INDEX') {
          aStat = a.index;
          bStat = b.index;
        } else if (sort.field === 'LEVEL') {
          if (!a.progress || !b.progress) return 0;
          aStat = a.progress.level;
          bStat = b.progress.level;
        } else {
          if (!a.stats || !b.stats) return 0;
          aStat = a.stats[field as keyof KamiStats].total;
          bStat = b.stats[field as keyof KamiStats].total;
        }
        const diff = aStat - bStat;
        if (diff != 0) return diff * direction;
      }
      return 0;
    });
    return sorted;
  };

  // get the list of kamis that should be displayed
  const getVisibleKamis = () => {
    const count = Math.min(limit, filtered.length);
    const sorted = sortKamis(filtered);
    return sorted.slice(0, count);
  };

  ///////////////////
  // DISPLAY

  return (
    <Container ref={containerRef}>
      <Overlay top={0.6} left={0.6}>
        <Text>
          {filtered.length}/{entities.length}
        </Text>
      </Overlay>
      {!loaded && <EmptyText size={2.5} text={LOADING_TEXT} />}
      {getVisibleKamis().map((kami) => getKamiBlock(kami))}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  padding: 0.6vw;
  width: 100%;

  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
`;

const Text = styled.div`
  font-size: 0.6vw;
`;
