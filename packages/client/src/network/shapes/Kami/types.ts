import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { KAMI_BASE_URI } from 'constants/media';
import { Components } from 'network/';
import { Harvest } from '../Harvest';
import { DetailedEntity } from '../utils';
import {
  getKamiIndex,
  getLevel,
  getMediaURI,
  getName,
  getRerolls,
  getState,
} from '../utils/component';
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
}

// minimal gacha kami. reduced querying for performance
export interface GachaKami extends BaseKami {
  level?: number;
  stats: Stats;
}

// standardized shape of a Kami Entity
export interface Kami extends BaseKami {
  state: string; // what do? // belongs with LastTime, LastActionTime and last health sync
  // battles?: Battles;
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
  battles?: boolean;
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
export const getBase = (world: World, comps: Components, entity: EntityIndex): BaseKami => {
  return {
    ObjectType: 'KAMI',
    entity,
    id: world.entities[entity],
    index: getKamiIndex(comps, entity),
    name: getName(comps, entity),
    image: getImage(comps, entity),
  };
};

export const getGachaKami = (world: World, comps: Components, entity: EntityIndex): GachaKami => {
  return {
    ...getBase(world, comps, entity),
    level: getLevel(comps, entity),
    stats: getStats(world, comps, entity), // skips bonus calcs
  };
};

// get a Kami from its EnityIndex. includes options for which data to include
export const get = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  options?: Options
): Kami => {
  const kami: Kami = {
    ...getBase(world, comps, entity),
    state: getState(comps, entity),
  };

  // if (options?.battles) kami.battles = getBattles(world, comps, entity);
  if (options?.bonus) kami.bonuses = getBonuses(world, comps, entity);
  if (options?.config) kami.config = getConfigs(world, comps);
  if (options?.flags) kami.flags = getFlags(world, comps, entity);
  if (options?.harvest) kami.harvest = getHarvest(world, comps, entity);
  if (options?.progress) kami.progress = getProgress(comps, entity);
  if (options?.rerolls) kami.rerolls = getRerolls(comps, entity);
  if (options?.skills) kami.skills = getSkills(world, comps, entity);
  if (options?.stats) kami.stats = getStats(world, comps, entity, true);
  if (options?.time) kami.time = getTimes(comps, entity);
  if (options?.traits) kami.traits = getTraits(world, comps, entity);

  return kami;
};

const getImage = (comps: Components, entity: EntityIndex): string => {
  const traits = getMediaURI(comps, entity);
  return KAMI_BASE_URI + traits + '.gif';
};
