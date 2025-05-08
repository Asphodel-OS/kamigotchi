import { EntityIndex, getEntitiesWithValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  getAllKamis,
  getKami,
  getKamiByIndex,
  getKamiByName,
  KamiOptions,
} from 'network/shapes/Kami';
import { calcKamiScores, calcRarityScores } from './functions';

export const kamis = (world: World, components: Components) => {
  const { EntityType } = components;
  return {
    all: (options?: KamiOptions) => getAllKamis(world, components, options),
    get: (entity: EntityIndex, options?: KamiOptions) =>
      getKami(world, components, entity, options),
    getByIndex: (index: number, options?: KamiOptions) =>
      getKamiByIndex(world, components, index, options),
    getByName: (name: string, options?: KamiOptions) =>
      getKamiByName(world, components, name, options),
    entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'KAMI' })),
    indices: () => Array.from(components.KamiIndex.values.value.values()),
    scores: {
      rarity: (indices: number[]) => calcRarityScores(world, components, indices),
      overall: (indices: number[]) => calcKamiScores(world, components, indices),
    },
  };
};
