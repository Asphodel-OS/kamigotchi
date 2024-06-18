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
import { Kill, getKill } from '../Kill';
import { Production, getProduction } from '../Production';
import { Skill, getHolderSkills } from '../Skill';
import { Stats, getStats } from '../Stats';
import { TraitIndices, Traits, getTraits } from '../Trait';
import { DetailedEntity } from '../utils/EntityTypes';
import { calcHealthRate } from './functions';

// standardized shape of a Kami Entity
export interface Kami extends DetailedEntity {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  level: number;
  experience: KamiExperience;
  rerolls: number;
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
  deaths?: Kill[];
  kills?: Kill[];
  production?: Production;
  skills?: Skill[];
  traits?: Traits;
  affinities?: string[];
  nameable: boolean;
}

interface KamiExperience {
  current: number;
  threshold: number;
}

// optional data to populate for a Kami Entity
export interface Options {
  account?: boolean;
  deaths?: boolean;
  kills?: boolean;
  production?: boolean;
  skills?: boolean;
  traits?: boolean;
}

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
    IsKill,
    IsProduction,
    IsRegistry,
    LastTime,
    LastActionTime,
    Level,
    MediaURI,
    Name,
    PetID,
    PetIndex,
    Reroll,
    SkillPoint,
    SourceID,
    StartTime,
    State,
    TargetID,
    OwnsPetID,
  } = components;

  const id = world.entities[entityIndex];

  // populate the base Kami data
  let kami: Kami = {
    ObjectType: 'KAMI',
    id: id,
    index: getComponentValue(PetIndex, entityIndex)?.value as number,
    entityIndex,
    name: getComponentValue(Name, entityIndex)?.value as string,
    image: getComponentValue(MediaURI, entityIndex)?.value as string,
    level: (getComponentValue(Level, entityIndex)?.value ?? (1 as number)) * 1,
    experience: {
      current: (getComponentValue(Experience, entityIndex)?.value ?? (0 as number)) * 1,
      threshold: 0,
    },
    state: getComponentValue(State, entityIndex)?.value as string,
    nameable: !hasFlag(world, components, id, 'NOT_NAMEABLE'),
    time: {
      cooldown: {
        last: (getComponentValue(LastActionTime, entityIndex)?.value as number) * 1,
        requirement: getConfigFieldValue(world, components, 'KAMI_STANDARD_COOLDOWN'),
      },
      last: (getComponentValue(LastTime, entityIndex)?.value as number) * 1,
      start: (getComponentValue(StartTime, entityIndex)?.value as number) * 1,
    },
    rerolls: (getComponentValue(Reroll, entityIndex)?.value ?? (0 as number)) * 1,
    skillPoints: (getComponentValue(SkillPoint, entityIndex)?.value ?? (0 as number)) * 1,
    stats: getStats(components, entityIndex),
    bonuses: getKamiBonuses(world, components, entityIndex),
    config: getKamiConfig(world, components),
  };

  /////////////////
  // OPTIONAL DATA

  // populate Account
  if (options?.account) {
    const accountID = getComponentValue(OwnsPetID, entityIndex)?.value as EntityID;
    const accountIndex = world.entityToIndex.get(accountID);
    if (accountIndex) kami.account = getAccount(world, components, accountIndex);
  }

  // populate Kills where our kami is the victim
  if (options?.deaths) {
    const deaths: Kill[] = [];
    const killEntityIndices = Array.from(
      runQuery([Has(IsKill), HasValue(TargetID, { value: kami.id })])
    );

    for (let i = 0; i < killEntityIndices.length; i++) {
      deaths.push(getKill(world, components, killEntityIndices[i], { source: true }));
    }
    deaths.sort((a, b) => b.time - a.time);

    kami.deaths = deaths;
  }

  // populate Kills where our kami is the aggressor
  if (options?.kills) {
    const kills: Kill[] = [];
    const killEntityIndices = Array.from(
      runQuery([Has(IsKill), HasValue(SourceID, { value: kami.id })])
    );

    for (let i = 0; i < killEntityIndices.length; i++) {
      kills.push(getKill(world, components, killEntityIndices[i], { target: true }));
    }
    kills.sort((a, b) => b.time - a.time);

    kami.kills = kills;
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
    kami.traits = getTraits(world, components, traitIndices);

    // adding affinities
    kami.affinities = [kami.traits.body.affinity, kami.traits.hand.affinity];
  }

  // populate Production
  // NOTE: productions should come after traits for harvest calcs to work correctly
  if (options?.production) {
    const productionIndex = Array.from(
      runQuery([Has(IsProduction), HasValue(PetID, { value: kami.id })])
    )[0];
    if (productionIndex)
      kami.production = getProduction(world, components, productionIndex, { node: true }, kami);
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
