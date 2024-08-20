import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { StatComponent } from 'network/components/definitions/StatComponent';

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
  stamina: Stat;
}

// get the stats of an entity
// get the Stats from the EnityIndex of a Kami
export const getStats = (components: Components, index: EntityIndex): Stats => {
  const { Harmony, Health, Power, Slots, Stamina, Violence } = components;

  return {
    health: getStat(index, Health),
    power: getStat(index, Power),
    violence: getStat(index, Violence),
    harmony: getStat(index, Harmony),
    slots: getStat(index, Slots),
    stamina: getStat(index, Stamina),
  };
};

export const getStat = (index: EntityIndex, type: StatComponent): Stat => {
  const raw = BigInt(getComponentValue(type, index)?.value || 0);

  const base = Number(BigInt.asIntN(32, (raw >> 192n) & 0xffffffffffffffffn));
  const shift = Number(BigInt.asIntN(32, (raw >> 128n) & 0xffffffffffffffffn));
  const boost = Number(BigInt.asIntN(32, (raw >> 64n) & 0xffffffffffffffffn));
  const sync = Number(BigInt.asIntN(32, raw & 0xffffffffffffffffn));

  return {
    base: base,
    shift: shift,
    boost: boost,
    sync: sync,
    rate: 0,
    total: (1 + boost / 1000) * (base + shift),
  };
};

export const sync = (stat: Stat, amt: number): number => {
  stat.sync = Math.max(0, stat.sync + amt);
  stat.sync = Math.min(stat.total, stat.sync + amt);
  return stat.sync;
};
