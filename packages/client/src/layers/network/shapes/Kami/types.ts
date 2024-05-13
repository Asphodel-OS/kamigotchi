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

import { Components } from 'layers/network';
import { Account, getAccount } from '../Account';
import { Bonuses, getBonusValue, getBonuses } from '../Bonus';
import { getConfigFieldValue, getConfigFieldValueArray } from '../Config';
import { Kill, getKill } from '../Kill';
import { Production, calcProductionRate, getProduction } from '../Production';
import { Skill, getHolderSkills } from '../Skill';
import { Stats, getStats } from '../Stats';
import { TraitIndices, Traits, getTraits } from '../Trait';
import { DetailedEntity } from '../utils/EntityTypes';

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
  bonuses: Bonuses;
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
  namable: boolean;
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
    CanName,
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

  // populate the base Kami data
  let kami: Kami = {
    ObjectType: 'KAMI',
    id: world.entities[entityIndex],
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
    namable: getComponentValue(CanName, entityIndex)?.value as boolean,
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
    bonuses: getBonuses(world, components, entityIndex),
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

  // populate Production
  if (options?.production) {
    const productionIndex = Array.from(
      runQuery([Has(IsProduction), HasValue(PetID, { value: kami.id })])
    )[0];
    if (productionIndex)
      kami.production = getProduction(world, components, productionIndex, { node: true });
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

  /////////////////
  // ADJUSTMENTS
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

  // health change rate for harvesting/resting kami
  let healthRate = 0;
  if (kami.state === 'HARVESTING') {
    let harvestRate = 0;
    if (kami.production) harvestRate = calcProductionRate(world, components, kami.production);
    const strainConfig = getConfigFieldValueArray(world, components, 'KAMI_MUSU_STRAIN');
    const boostBonus = getBonusValue(world, components, kami.id, 'HARVEST_DRAIN');
    const ratio = strainConfig[2];
    const boost = strainConfig[6] + boostBonus;
    const precision = 10 ** (strainConfig[3] + strainConfig[7]);
    healthRate = (-1 * harvestRate * ratio * boost) / precision;
  } else if (kami.state === 'RESTING') {
    const metabolismConfig = getConfigFieldValueArray(world, components, 'KAMI_REST_METABOLISM');
    const boostBonus = getBonusValue(world, components, kami.id, 'RESTING_RECOVERY');
    const ratio = metabolismConfig[2];
    const boost = metabolismConfig[6] + boostBonus;
    const precision = 10 ** (metabolismConfig[3] + metabolismConfig[7]);
    healthRate = (kami.stats.harmony.total * ratio * boost) / (precision * 3600);
  }
  kami.stats.health.rate = healthRate;

  return kami;
};
