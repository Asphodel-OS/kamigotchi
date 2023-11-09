import {
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';

// standardized shape of Stats on an Entity
export interface Stats {
  health: number;
  power: number;
  violence: number;
  harmony: number;
  slots: number;
}

// get the stats of an entity
// get the Stats from the EnityIndex of a Kami
export const getStats = (layers: Layers, index: EntityIndex): Stats => {
  const {
    network: {
      components: {
        Harmony,
        Health,
        Power,
        Slots,
        Violence,
      },
    },
  } = layers;

  return {
    health: (getComponentValue(Health, index)?.value || 0 as number) * 1,
    power: (getComponentValue(Power, index)?.value || 0 as number) * 1,
    violence: (getComponentValue(Violence, index)?.value || 0 as number) * 1,
    harmony: (getComponentValue(Harmony, index)?.value || 0 as number) * 1,
    slots: (getComponentValue(Slots, index)?.value || 0 as number) * 1,
  };
}