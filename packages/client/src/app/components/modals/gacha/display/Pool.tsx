import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Overlay, Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami, KamiOptions } from 'network/shapes/Kami';
import { BaseKami } from 'network/shapes/Kami/types';
import { Stats } from 'network/shapes/Stats';
import { playClick } from 'utils/sounds';
import { Filter, Sort } from '../types';
import { KamiBlock } from './KamiBlock';

const LOADING_TEXT = ['your gacha pool is loading', 'please be patient'];

interface Props {
  controls: {
    limit: number;
    sorts: Sort[];
    filters: Filter[];
  };
  caches: {
    kamis: Map<EntityIndex, Kami>;
    kamiBlocks: Map<EntityIndex, JSX.Element>;
  };
  data: {
    entities: EntityIndex[];
  };
  utils: {
    getBaseKami: (entity: EntityIndex) => BaseKami;
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
  };
  isVisible: boolean;
}

export const Pool = (props: Props) => {
  const { controls, caches, data, utils, isVisible } = props;
  const { limit, filters, sorts } = controls;
  const { kamiBlocks, kamis } = caches;
  const { entities } = data;
  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();

  const [filtered, setFiltered] = useState<Kami[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  // when the entities or filters change, update the list of filtered kamis
  // also update on load with however many kamis are initially detected (doesnt matter how many)
  useEffect(() => {
    const isOpen = modals.gacha && isVisible;
    if (isOpen) filterKamis();

    // inital load. waiting as a bit of a hackaround for complete data
    if (!loaded && entities.length > 0) {
      setTimeout(() => {
        filterKamis();
        setLoaded(true);
        console.log(`gacha pool loaded: ${entities.length} initial kamis`);
      }, 1500);
    }
  }, [filters, entities.length]);

  //////////////////
  // INTERACTION

  const kamiOnClick = (kami: BaseKami) => {
    const sameKami = kamiIndex === kami.index;
    if (!sameKami) setKami(kami.index);
    if (modals.kami && sameKami) setModals({ ...modals, kami: false });
    else setModals({ ...modals, gacha: true, kami: true, party: true });
    playClick();
  };

  //////////////////
  // INTERPRETATION

  // returns a kami from the cache, or creates a new one and sets it if not found
  // NOTE: this is safe because we dont expect updates on kamis in the gacha pool
  const getKami = (entity: EntityIndex) => {
    if (!kamis.has(entity)) kamis.set(entity, utils.getKami(entity));
    return kamis.get(entity)!;
  };

  // get the react component of a KamiBlock displayed in the pool
  const getKamiBlock = (kami: Kami) => {
    const entity = kami.entityIndex;
    if (!kamiBlocks.has(entity)) {
      const tooltip = [
        `Health: ${kami.stats.health.total}`,
        `Power: ${kami.stats.power.total}`,
        `Violence: ${kami.stats.violence.total}`,
        `Harmony: ${kami.stats.harmony.total}`,
        `Slots: ${kami.stats.slots.total}`,
      ];

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
        if (filter.field === 'INDEX') return kami.index >= filter.min && kami.index <= filter.max;
        if (filter.field === 'LEVEL') return kami.level >= filter.min && kami.level <= filter.max;
        else {
          const value = kami.stats[filter.field.toLowerCase() as keyof Stats].total;
          return value >= filter.min && value <= filter.max;
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
        if (['INDEX', 'LEVEL'].includes(sort.field)) {
          aStat = a[field as keyof Kami] as number;
          bStat = b[field as keyof Kami] as number;
        } else {
          aStat = a.stats[field as keyof Stats].total;
          bStat = b.stats[field as keyof Stats].total;
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
    <Container style={{ display: props.isVisible ? 'flex' : 'none' }}>
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
`;

const Text = styled.div`
  font-size: 0.6vw;
`;
