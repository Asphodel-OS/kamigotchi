import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, KamiBlock, TextTooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Auction } from 'network/shapes/Auction';
import { KamiStats } from 'network/shapes/Kami';
import { Kami } from 'network/shapes/Kami/types';
import { Filter, Sort } from '../../types';
import { EMPTY_TEXT, LOADING_TEXT } from './constants';

const LOAD_CHUNK_SIZE = 200; // Adjust based on performance needs

export const KamiView = ({
  controls,
  caches,
  data,
  state,
  utils,
  isVisible,
}: {
  controls: {
    sorts: Sort[];
    filters: Filter[];
  };
  caches: {
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    auction: Auction;
    entities: EntityIndex[];
  };
  state: {
    tick: number;
  };
  utils: {
    getKami: (entity: EntityIndex) => Kami;
  };
  isVisible: boolean;
}) => {
  const { filters, sorts } = controls;
  const { kamiBlocks } = caches;
  const { entities } = data;
  const { tick } = state;
  const { getKami } = utils;

  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();
  const containerRef = useRef<HTMLDivElement>(null);

  const [filtered, setFiltered] = useState<Kami[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [limit, setLimit] = useState(20);

  // filter (and implicitly populate) the pool of kamis on initial lod
  useEffect(() => {
    if (isLoaded || isLoading || !modals.gacha) return;
    setIsLoading(true);
    loadKamis();
  }, [modals.gacha]);

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
        <TextTooltip key={kami.index} text={tooltip}>
          <KamiBlock key={kami.index} kami={kami} />
        </TextTooltip>
      );
    }
    return kamiBlocks.get(entity)!;
  };

  //////////////////
  // ORGANIZATION

  // load the entire set of pool kamis into the cache
  const loadKamis = () => {
    console.log(`gacha pool is loading: ${entities.length} initial kamis`);
    processInChunks(
      entities,
      LOAD_CHUNK_SIZE,
      (chunk: EntityIndex[]) => chunk.map((entity) => getKami(entity)),
      () => {
        console.log(`gacha pool finished loading: ${entities.length} initial kamis`);
        filterKamis();
        setIsLoading(false);
        setIsLoaded(true);
      }
    );
  };

  // filter the pool of kamis based on applied filters
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

  // sort kamis according a sequence of sorts
  const sortKamis = (kamis: Kami[]) => {
    const sorted = [...kamis].sort((a, b) => {
      for (let i = 0; i < sorts.length; i++) {
        const sort = sorts[i];
        const field = sort.field.toLowerCase();
        const direction = sort.ascending ? 1 : -1;

        let aStat = 0;
        let bStat = 0;
        if (sort.field === 'INDEX') {
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
    <Container ref={containerRef} isVisible={isVisible}>
      <EmptyText size={2.1} text={LOADING_TEXT} isHidden={!isLoading} />
      <EmptyText size={2.1} text={EMPTY_TEXT} isHidden={!isLoaded || entities.length > 0} />
      {getVisibleKamis().map((kami) => getKamiBlock(kami))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  padding: 0.6em;
  width: 100%;
  height: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row wrap;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
`;

// Helper function for not blocking renders on large computations
const processInChunks = (
  items: EntityIndex[],
  chunkSize: number,
  processChunk: (chunk: EntityIndex[]) => void,
  onComplete: () => void
) => {
  let index = 0;

  const process = () => {
    const chunk = items.slice(index, index + chunkSize);
    processChunk(chunk);
    index += chunkSize;

    if (index < items.length) requestAnimationFrame(process);
    else onComplete();
  };

  requestAnimationFrame(process);
};
