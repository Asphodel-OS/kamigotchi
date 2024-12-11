import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Harvest } from '../Harvest';
import { DetailedEntity, getEntityByHash } from '../utils';
import { getRerolls } from '../utils/component';
import { Bonuses, getBonuses } from './bonuses';
import { Configs, getConfigs } from './configs';
import { Flags, getFlags } from './flags';
import { getHarvest } from './harvest';
import { Progress, getProgress } from './progress';
import { Skills, getSkills } from './skills';
import { Stats, getStats } from './stats';
import { Times, getTimes } from './times';
import { Traits, getTraits } from './traits';

export interface BaseKami extends DetailedEntity {
  id: EntityID;
  index: number;
  entity: EntityIndex;
}

// minimal gacha kami. reduced querying for performance
export interface GachaKami extends BaseKami {
  level: number;
  stats: Stats;
}

// standardized shape of a Kami Entity
export interface Kami extends BaseKami {
  state: string; // what do? // belongs with LastTime, LastActionTime and last health sync
  bonuses?: Bonuses;
  config?: Configs;
  flags?: Flags;
  harvest?: Harvest;
  progress?: Progress;
  rerolls?: number;
  skills?: Skills;
  stats?: Stats;
  time?: Times;
  traits?: Traits;
}

// optional data to populate for a Kami Entity
export interface Options {
  bonus?: boolean;
  config?: boolean;
  flags?: boolean;
  harvest?: boolean;
  progress?: boolean;
  rerolls?: boolean;
  skills?: boolean;
  stats?: boolean;
  time?: boolean;
  traits?: boolean;
}

// gets a Kami from EntityIndex with just the bare minimum of data
export const getBaseKami = (
  world: World,
  components: Components,
  entity: EntityIndex
): BaseKami => {
  const { KamiIndex, Name, MediaURI } = components;
  return {
    ObjectType: 'KAMI',
    entity,
    id: world.entities[entity],
    index: getComponentValue(KamiIndex, entity)?.value as number,
    name: getComponentValue(Name, entity)?.value as string,
    image: getComponentValue(MediaURI, entity)?.value as string,
  };
};

export const getGachaKami = (
  world: World,
  components: Components,
  entity: EntityIndex
): GachaKami => {
  const { Level } = components;
  return {
    ...getBaseKami(world, components, entity),
    level: (getComponentValue(Level, entity)?.value ?? 0) * 1,
    stats: getStats(world, components, entity), // skips bonus calcs
  };
};

// get a Kami from its EnityIndex. includes options for which data to include
export const getKami = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Kami => {
  const { State } = components;
  const kami: Kami = {
    ...getBaseKami(world, components, entity),
    state: getComponentValue(State, entity)?.value as string,
  };

  if (options?.bonus) kami.bonuses = getBonuses(world, components, entity);
  if (options?.config) kami.config = getConfigs(world, components);
  if (options?.flags) kami.flags = getFlags(world, components, entity);
  if (options?.harvest) kami.harvest = getHarvest(world, components, entity);
  if (options?.progress) kami.progress = getProgress(world, components, entity);
  if (options?.rerolls) kami.rerolls = getRerolls(components, entity);
  if (options?.skills) kami.skills = getSkills(world, components, entity);
  if (options?.stats) kami.stats = getStats(world, components, entity);
  if (options?.time) kami.time = getTimes(components, entity);
  if (options?.traits) kami.traits = getTraits(world, components, entity);

  return kami;
};

////////////////
// IDs

export function getKamiEntity(world: World, index: number): EntityIndex | undefined {
  return getEntityByHash(world, ['kami.id', index], ['string', 'uint32']);
}
