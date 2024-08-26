import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami, KamiOptions } from 'network/shapes/Kami';
import { BaseKami } from 'network/shapes/Kami/types';
import { Stats } from 'network/shapes/Stats';
import { playClick } from 'utils/sounds';
import { Filter } from '../types';
import { KamiBlock } from './KamiBlock';

interface Props {
  limit: number;
  filters: Filter[];
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
  const { limit, filters, caches, data, utils, isVisible } = props;
  const { entities } = data;
  const { kamiBlocks, kamis } = caches;
  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();

  const [filtered, setFiltered] = useState<Kami[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  // when the entities or filters change, update the list of filtered kamis
  // also update on first opening of the modal
  useEffect(() => {
    const isOpen = modals.gacha && isVisible;
    if (isOpen) filterKamis();
    if (isOpen && entities.length > 0 && !loaded) {
      filterKamis();
      setLoaded(true);
    }
  }, [modals.gacha, isVisible, filters, entities.length]);

  //////////////////
  // INTERACTION

  const kamiOnClick = (kami: BaseKami) => {
    const sameKami = kamiIndex === kami.index;
    if (!sameKami) setKami(kami.index);
    if (modals.kami && sameKami) setModals({ ...modals, kami: false });
    else setModals({ ...modals, kami: true });
    playClick();
  };

  //////////////////
  // INTERPRETATION

  const filterKamis = () => {
    const all = entities.map((entity) => getKami(entity));
    const newFiltered = all.filter((kami) => {
      return filters.every((filter) => {
        if (filter.field === 'INDEX') return kami.index >= filter.min && kami.index <= filter.max;
        if (filter.field === 'LEVEL') return kami.level >= filter.min && kami.level <= filter.max;
        else {
          const value = kami.stats[filter.field.toLowerCase() as keyof Stats].base;
          return value >= filter.min && value <= filter.max;
        }
      });
    });

    console.log('filtered', newFiltered);
    setFiltered(newFiltered);
  };

  const getKamiText = (kami: Kami): string[] => {
    return [
      `Health: ${kami.stats.health.base}`,
      `Power: ${kami.stats.power.base}`,
      `Violence: ${kami.stats.violence.base}`,
      `Harmony: ${kami.stats.harmony.base}`,
      `Slots: ${kami.stats.slots.base}`,
    ];
  };

  // returns a kami from the cache, or creates a new one and sets it if not found
  // NOTE: this is safe because we dont expect updates on kamis in the gacha pool
  const getKami = (entity: EntityIndex) => {
    if (!kamis.has(entity)) kamis.set(entity, utils.getKami(entity));
    return kamis.get(entity)!;
  };

  // get the reach component of a Kami Block in the pool
  const getKamiBlock = (kami: Kami) => {
    const entity = kami.entityIndex;
    if (!kamiBlocks.has(entity)) {
      kamiBlocks.set(
        entity,
        <Tooltip key={kami.index} text={getKamiText(kami)}>
          <KamiBlock key={kami.index} kami={kami} onClick={() => kamiOnClick(kami)} />
        </Tooltip>
      );
    }
    return kamiBlocks.get(entity)!;
  };

  // get the list of kamis that should be displayed
  const getVisibleKamis = () => {
    const count = Math.min(limit, filtered.length);
    return filtered.slice(0, count);
  };

  ///////////////////
  // DISPLAY

  return (
    <Container style={{ display: props.isVisible ? 'flex' : 'none' }}>
      {getVisibleKamis().map((kami) => getKamiBlock(kami))}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`;
