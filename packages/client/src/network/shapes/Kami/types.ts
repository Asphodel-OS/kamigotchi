import {
  Component,
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Account, getAccount } from '../Account';
import { KamiBonuses, getKamiBonuses } from '../Bonus';
import {
  KamiConfig,
  getConfigFieldValue,
  getConfigFieldValueArray,
  getKamiConfig,
} from '../Config';
import { hasFlag } from '../Flag';
import { Harvest, getHarvest } from '../Harvest';
import { Skill, getHolderSkills } from '../Skill';
import { Stats, getStats } from '../Stats';
import { TraitIndices, Traits, getTraits } from '../Trait';
import { DetailedEntity } from '../utils/EntityTypes';
import { calcHealthRate } from './functions';

export interface BareKami extends DetailedEntity {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
}

// standardized shape of a Kami Entity
export interface Kami extends BareKami {
  level: number;
  experience: KamiExperience;
  state: string;
  skillPoints: number;
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
  account?: Account;
  flags?: {
    namable: boolean;
  };
  production?: Harvest;
  skills?: Skill[];
  traits?: Traits;
  rerolls?: number;
}

interface KamiExperience {
  current: number;
  threshold: number;
}

// optional data to populate for a Kami Entity
export interface Options {
  account?: boolean;
  flags?: boolean;
  production?: boolean;
  skills?: boolean;
  traits?: boolean;
  rerolls?: boolean;
}

// gets a Kami from EntityIndex with just the bare minimum of data
export const getBareKami = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): BareKami => {
  const { PetIndex, Name, MediaURI } = components;
  return {
    ObjectType: 'KAMI',
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(PetIndex, entityIndex)?.value as number,
    name: getComponentValue(Name, entityIndex)?.value as string,
    image: getComponentValue(MediaURI, entityIndex)?.value as string,
  };
};

// get a Kami from its EnityIndex. includes options for which data to include
export const getKami = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: Options
): Kami => {
  const {
    BackgroundIndex,
    BodyIndex,
    ColorIndex,
    Experience,
    FaceIndex,
    HandIndex,
    IsProduction,
    IsRegistry,
    LastTime,
    LastActionTime,
    Level,
    MediaURI,
    PetID,
    Reroll,
    SkillPoint,
    StartTime,
    State,
    OwnsPetID,
  } = components;

  const id = world.entities[entityIndex];

  // populate the base Kami data
  const kami: Kami = {
    ...getBareKami(world, components, entityIndex),
    image: getComponentValue(MediaURI, entityIndex)?.value as string,
    level: (getComponentValue(Level, entityIndex)?.value ?? (1 as number)) * 1,
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
    stats: getStats(components, entityIndex),
    bonuses: getKamiBonuses(world, components, entityIndex),
    config: getKamiConfig(world, components),
  };

  /////////////////
  // OPTIONAL DATA

  // populate Account
  if (options?.account) {
    const accountID = formatEntityID(getComponentValue(OwnsPetID, entityIndex)?.value ?? '');
    const accountIndex = world.entityToIndex.get(accountID);
    if (accountIndex) kami.account = getAccount(world, components, accountIndex);
  }

  if (options?.flags) {
    kami.flags = {
      namable: !hasFlag(world, components, id, 'NOT_NAMEABLE'),
    };
  }

  // populate Skills
  if (options?.skills) {
    kami.skills = getHolderSkills(world, components, kami.id);
  }

  // populate Traits
  if (options?.traits) {
    // gets registry entity for a trait
    const getTraitPointer = (type: Component) => {
      const traitIndex = getComponentValue(type, entityIndex)?.value as number;
      return Array.from(runQuery([Has(IsRegistry), HasValue(type, { value: traitIndex })]))[0];
    };

    // adding traits
    const backgroundIndex = getTraitPointer(BackgroundIndex);
    const bodyIndex = getTraitPointer(BodyIndex);
    const colorIndex = getTraitPointer(ColorIndex);
    const faceIndex = getTraitPointer(FaceIndex);
    const handIndex = getTraitPointer(HandIndex);

    const traitIndices: TraitIndices = {
      backgroundIndex,
      bodyIndex,
      colorIndex,
      faceIndex,
      handIndex,
    };
    kami.traits = getTraits(components, traitIndices);
  }

  // populate Harvest
  // NOTE: productions should come after traits for harvest calcs to work correctly
  if (options?.production) {
    const productionResults = Array.from(
      runQuery([Has(IsProduction), HasValue(PetID, { value: kami.id })])
    );
    const productionIndex = productionResults[0];
    if (productionIndex)
      kami.production = getHarvest(world, components, productionIndex, { node: true }, kami);
  }

  if (options?.rerolls) {
    kami.rerolls = (getComponentValue(Reroll, entityIndex)?.value ?? (0 as number)) * 1;
  }

  /////////////////
  // ADJUSTMENTS

  kami.time.cooldown.requirement += kami.bonuses.general.cooldown;
  kami.stats.health.rate = calcHealthRate(kami);

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
