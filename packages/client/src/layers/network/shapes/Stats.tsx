import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { StatComponent } from 'layers/network/components/definitions/StatComponent';

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
export const getStats = (components: Components, index: EntityIndex): Stats => {
  const { Harmony, Health, Power, Slots, Violence } = components;

  return {
    health: getStat(index, Health),
    power: getStat(index, Power),
    violence: getStat(index, Violence),
    harmony: getStat(index, Harmony),
    slots: getStat(index, Slots),
  };
};

export const getStat = (index: EntityIndex, type: StatComponent): Stat => {
  const raw = BigInt(getComponentValue(type, index)?.value || 0);

  const base = Number((raw >> 192n) & 0xffffffffffffffffn);
  const shift = Number((raw >> 128n) & 0xffffffffffffffffn);
  const boost = Number((raw >> 64n) & 0xffffffffffffffffn);
  const sync = Number(raw & 0xffffffffffffffffn);

  return {
    base: base,
    shift: shift,
    boost: boost,
    sync: sync,
    rate: 0,
    total: (1 + boost / 1000) * (base + shift),
  };
};
