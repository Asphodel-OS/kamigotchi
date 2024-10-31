import { EntityIndex, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getBonusValue } from '../Bonus';
import { Stat, getStat } from '../Stats';

export interface Stats {
  health: Stat;
  power: Stat;
  violence: Stat;
  harmony: Stat;
  slots: Stat;
}

// get the stats of a kami
export const getStats = (
  world: World,
  components: Components,
  entity: EntityIndex,
  withBonus?: boolean
): Stats => {
  const { Harmony, Health, Power, Slots, Stamina, Violence } = components;
  const id = world.entities[entity];

  const getBonus = (type: string) => {
    if (!id || !withBonus) return 0;
    return getBonusValue(world, components, type, id);
  };

  let stats = {
    health: getStat(entity, Health, getBonus('STAT_HEALTH_SHIFT')),
    power: getStat(entity, Power, getBonus('STAT_POWER_SHIFT')),
    violence: getStat(entity, Violence, getBonus('STAT_VIOLENCE_SHIFT')),
    harmony: getStat(entity, Harmony, getBonus('STAT_HARMONY_SHIFT')),
    slots: getStat(entity, Slots, getBonus('STAT_SLOTS_SHIFT')),
  };

  return stats;
};

// get the health stat of an entity
export const getHealth = (world: World, components: Components, entity: EntityIndex): Stat => {
  const { Health } = components;
  const id = world.entities[entity];
  const bonus = getBonusValue(world, components, 'STAT_HEALTH_SHIFT', id);
  return getStat(entity, Health, bonus);
};
