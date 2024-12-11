import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { KamiBonuses, getKamiBonuses } from '../Bonus';
import {
  KamiConfig,
  getConfigFieldValue,
  getConfigFieldValueArray,
  getKamiConfig,
} from '../Config';
import { hasFlag } from '../Flag';
import { Harvest, getHarvestForKami } from '../Harvest';
import { Skill, getHolderSkills } from '../Skill';
import { Stats, getStats } from '../Stats';
import { Traits, getKamiTraits } from '../Trait';
import { DetailedEntity, getEntityByHash } from '../utils';
import { calcHealthRate } from './functions';

export interface BaseKami extends DetailedEntity {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
}

// minimal gacha kami. reduced querying for performance
export interface GachaKami extends BaseKami {
  level: number;
  stats: Stats;
}

// standardized shape of a Kami Entity
export interface Kami extends BaseKami {
  level: number;
  state: string;

  // less necessary
  experience: {
    current: number;
    threshold: number;
  };
  stats: Stats;
  bonuses: KamiBonuses;
  config: KamiConfig;
  time: {
    cooldown: {
      last: number;
      requirement: number;
    };
    last: number;
    start: number;
  };

  // much less necessary
  skillPoints: number;
  flags?: {
    namable: boolean;
    skillReset: boolean;
  };
  harvest?: Harvest;
  skills?: Skill[];
  traits?: Traits;
  rerolls?: number;
}

// optional data to populate for a Kami Entity
export interface Options {
  flags?: boolean;
  harvest?: boolean;
  skills?: boolean;
  traits?: boolean;
  rerolls?: boolean;
}

// gets a Kami from EntityIndex with just the bare minimum of data
export const getBaseKami = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): BaseKami => {
  const { KamiIndex, Name, MediaURI } = components;
  return {
    ObjectType: 'KAMI',
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(KamiIndex, entityIndex)?.value as number,
    name: getComponentValue(Name, entityIndex)?.value as string,
    image: getComponentValue(MediaURI, entityIndex)?.value as string,
  };
};

export const getGachaKami = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): GachaKami => {
  const { Level } = components;

  return {
    ...getBaseKami(world, components, entityIndex),
    level: (getComponentValue(Level, entityIndex)?.value ?? 0) * 1,
    stats: getStats(world, components, entityIndex), // skips bonus calcs
  };
};

// get a Kami from its EnityIndex. includes options for which data to include
export const getKami = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: Options
): Kami => {
  const { Experience, LastTime, LastActionTime, Level, Reroll, SkillPoint, StartTime, State } =
    components;

  const id = world.entities[entityIndex];

  // populate the base Kami data
  const kami: Kami = {
    ...getBaseKami(world, components, entityIndex),
    level: (getComponentValue(Level, entityIndex)?.value ?? 0) * 1,
    experience: {
      current: (getComponentValue(Experience, entityIndex)?.value ?? (0 as number)) * 1,
      threshold: 0,
    },
    state: getComponentValue(State, entityIndex)?.value as string,
    time: {
      cooldown: {
        last: (getComponentValue(LastActionTime, entityIndex)?.value as number) * 1,
        requirement: getConfigFieldValue(world, components, 'KAMI_STANDARD_COOLDOWN'),
      },
      last: (getComponentValue(LastTime, entityIndex)?.value as number) * 1,
      start: (getComponentValue(StartTime, entityIndex)?.value as number) * 1,
    },
    skillPoints: (getComponentValue(SkillPoint, entityIndex)?.value ?? (0 as number)) * 1,
    stats: getStats(world, components, entityIndex, id),
    bonuses: getKamiBonuses(world, components, entityIndex),
    config: getKamiConfig(world, components),
  };

  /////////////////
  // OPTIONAL DATA

  if (options?.flags) {
    kami.flags = {
      namable: !hasFlag(world, components, id, 'NOT_NAMEABLE'),
      skillReset: hasFlag(world, components, id, 'CAN_RESET_SKILLS'),
    };
  }

  // populate Skills
  if (options?.skills) {
    kami.skills = getHolderSkills(world, components, kami.id);
  }

  // populate Traits
  if (options?.traits) kami.traits = getKamiTraits(world, components, entityIndex);

  // populate Harvest
  // NOTE: harvests should come after traits for harvest calcs to work correctly
  if (options?.harvest) {
    kami.harvest = getHarvestForKami(world, components, kami, { node: true });
  }

  if (options?.rerolls) {
    kami.rerolls = (getComponentValue(Reroll, entityIndex)?.value ?? (0 as number)) * 1;
  }

  /////////////////
  // ADJUSTMENTS

  kami.time.cooldown.requirement += kami.bonuses.general.cooldown;

  // only works if harvest is set
  kami.stats.health.rate = calcHealthRate(kami); // TODO: stop relying on this field

  // TODO: move these over to functions.ts now that we've standardized calcs
  // experience threshold calculation according to level
  if (kami.level) {
    const experienceBase = getConfigFieldValue(world, components, 'KAMI_LVL_REQ_BASE');
    const expereinceExponentArr = getConfigFieldValueArray(
      world,
      components,
      'KAMI_LVL_REQ_MULT_BASE'
    );
    const experienceExponent = expereinceExponentArr[0];
    const exponentPrecision = 10 ** expereinceExponentArr[1];
    kami.experience.threshold = Math.floor(
      experienceBase * ((1.0 * experienceExponent) / exponentPrecision) ** (kami.level - 1)
    );
  }

  return kami;
};

////////////////
// IDs

export function getKamiEntity(world: World, index: number): EntityIndex | undefined {
  return getEntityByHash(world, ['kami.id', index], ['string', 'uint32']);
}
