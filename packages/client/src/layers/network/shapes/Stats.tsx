import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { StatComponent } from 'layers/network/components/definitions/StatComponent';
import { NetworkLayer } from 'layers/network/types';

export interface Stat {
  base: number;
  shift: number;
  boost: number;
  sync: number;
  rate: number;
  total: number;
}

// standardized shape of Stats on an Entity
export interface Stats {
  health: Stat;
  power: Stat;
  violence: Stat;
  harmony: Stat;
  slots: Stat;
}

// get the stats of an entity
// get the Stats from the EnityIndex of a Kami
export const getStats = (network: NetworkLayer, index: EntityIndex): Stats => {
  const { Harmony, Health, Power, Slots, Violence } = network.components;

  return {
    health: getStat(index, Health),
    power: getStat(index, Power),
    violence: getStat(index, Violence),
    harmony: getStat(index, Harmony),
    slots: getStat(index, Slots),
  };
};

export const getStat = (index: EntityIndex, type: StatComponent): Stat => {
  let stat = (getComponentValue(type, index) || {}) as Stat;
  stat.total = (1 + stat.boost / 1000) * (stat.base + stat.shift);
  return stat;
};
