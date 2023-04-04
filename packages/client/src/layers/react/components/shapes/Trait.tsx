import {
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Stats, getStats } from './Stats';

// standardized shape of Stats on an Entity
export interface Trait {
  stats: Stats;
  name: string;
  affinity: string;
}

// get the Stats from the EnityIndex of a Kami
// feed in the trait registry entity
export const getTrait = (layers: Layers, index: EntityIndex): Trait => {
  const {
    network: {
      components: {
        Name,
        Affinity,
      },
    },
  } = layers;

  return {
    stats: getStats(layers, index),
    name: getComponentValue(Name, index)?.value || '' as string,
    affinity: getComponentValue(Affinity, index)?.value || '' as string,
  };
}