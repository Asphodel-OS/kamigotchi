import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { StatComponent } from 'network/components/definitions/StatComponent';
import { getBonusValue } from './Bonus';

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

export const NullStat: Stat = {
  base: 0,
  shift: 0,
  boost: 0,
  sync: 0,
  rate: 0,
  total: 0,
};

export const NullStats: Stats = {
  health: NullStat,
  power: NullStat,
  violence: NullStat,
  harmony: NullStat,
  slots: NullStat,
  stamina: NullStat,
};

// get the stats of an entity
// get the Stats from the EnityIndex of a Kami
export const getStats = (
  world: World,
  components: Components,
  entity: EntityIndex,
  bonusHolderID?: EntityID // optional, calc bonus if provided
): Stats => {
  const { Harmony, Health, Power, Slots, Stamina, Violence } = components;

  const getBonus = (type: string) => {
    return bonusHolderID ? getBonusValue(world, components, type, bonusHolderID) : 0;
  };

  let stats = {
    health: getStat(entity, Health, getBonus('STAT_HEALTH_SHIFT')),
    power: getStat(entity, Power, getBonus('STAT_POWER_SHIFT')),
    violence: getStat(entity, Violence, getBonus('STAT_VIOLENCE_SHIFT')),
    harmony: getStat(entity, Harmony, getBonus('STAT_HARMONY_SHIFT')),
    slots: getStat(entity, Slots, getBonus('STAT_SLOTS_SHIFT')),
    stamina: getStat(entity, Stamina, getBonus('STAT_STAMINA_SHIFT')),
  };

  return stats;
};

export const getStat = (index: EntityIndex, type: StatComponent, shiftBonus?: number): Stat => {
  const raw = BigInt(getComponentValue(type, index)?.value || 0);
  return getStatFromUint(raw, shiftBonus);
};

export const getStatFromUint = (value: bigint, shiftBonus?: number): Stat => {
  const base = Number(BigInt.asIntN(32, (value >> 192n) & 0xffffffffffffffffn));
  const shift =
    Number(BigInt.asIntN(32, (value >> 128n) & 0xffffffffffffffffn)) + (shiftBonus ?? 0);
  const boost = Number(BigInt.asIntN(32, (value >> 64n) & 0xffffffffffffffffn));
  const sync = Number(BigInt.asIntN(32, value & 0xffffffffffffffffn));

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
