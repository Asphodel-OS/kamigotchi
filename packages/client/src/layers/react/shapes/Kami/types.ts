import {
  Component,
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account, getAccount } from '../Account';
import { Bonuses, getBonuses } from '../Bonus';
import { getConfigFieldValue } from '../Config';
import { Kill, getKill } from '../Kill';
import { Production, getProduction } from '../Production';
import { Stats, getStats } from '../Stats';
import { Skill, getSkills } from '../Skill';
import { Traits, TraitIndices, getTraits } from '../Trait';


// standardized shape of a Kami Entity
export interface Kami {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  name: string;
  uri: string;
  level: number;
  experience: KamiExperience;
  health: number;
  healthRate: number;
  state: string;
  skillPoints: number;
  stats: Stats;
  bonusStats: Stats;
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
  layers: Layers,
  entityIndex: EntityIndex,
  options?: Options
): Kami => {
  const {
    network: {
      world,
      components: {
        AccountID,
        BackgroundIndex,
        BodyIndex,
        CanName,
        ColorIndex,
        Experience,
        FaceIndex,
        HealthCurrent,
        HandIndex,
        HolderID,
        IsBonus,
        IsKill,
        IsProduction,
        LastTime,
        LastActionTime,
        Level,
        MediaURI,
        Name,
        PetID,
        PetIndex,
        SkillPoint,
        SourceID,
        StartTime,
        State,
        TargetID,
        TraitIndex,
        Type,
      },
    },
  } = layers;

  // populate the base Kami data
  let kami: Kami = {
    id: world.entities[entityIndex],
    index: getComponentValue(PetIndex, entityIndex)?.value as number,
    entityIndex,
    name: getComponentValue(Name, entityIndex)?.value as string,
    uri: getComponentValue(MediaURI, entityIndex)?.value as string,
    level: (getComponentValue(Level, entityIndex)?.value ?? 1 as number) * 1,
    experience: {
      current: (getComponentValue(Experience, entityIndex)?.value ?? 0 as number) * 1,
      threshold: 0,
    },
    health: (getComponentValue(HealthCurrent, entityIndex)?.value as number) * 1,
    healthRate: 0,
    state: getComponentValue(State, entityIndex)?.value as string,
    namable: getComponentValue(CanName, entityIndex)?.value as boolean,
    time: {
      cooldown: {
        last: (getComponentValue(LastActionTime, entityIndex)?.value ?? 0 as number) * 1,
        requirement: getConfigFieldValue(layers.network, 'KAMI_IDLE_REQ'),
      },
      last: (getComponentValue(LastTime, entityIndex)?.value as number) * 1,
      start: (getComponentValue(StartTime, entityIndex)?.value as number) * 1,
    },
    skillPoints: (getComponentValue(SkillPoint, entityIndex)?.value ?? 0 as number) * 1,
    stats: getStats(layers, entityIndex),
    bonuses: getBonuses(layers, entityIndex),
    bonusStats: {
      health: 0,
      harmony: 0,
      violence: 0,
      power: 0,
      slots: 0,
    }
  };

  // bonus stats
  const bonusStatsEntityIndex = Array.from(
    runQuery([
      Has(IsBonus),
      HasValue(Type, { value: 'STAT' }),
      HasValue(HolderID, { value: kami.id }),
    ])
  );
  if (bonusStatsEntityIndex.length > 0) {
    kami.bonusStats = getStats(layers, bonusStatsEntityIndex[0]);
  }

  /////////////////
  // OPTIONAL DATA

  // populate Account
  if (options?.account) {
    const accountID = getComponentValue(AccountID, entityIndex)?.value as EntityID;
    const accountIndex = world.entityToIndex.get(accountID);
    if (accountIndex) kami.account = getAccount(layers, accountIndex);
  }

  // populate Kills where our kami is the victim
  if (options?.deaths) {
    const deaths: Kill[] = [];
    const killEntityIndices = Array.from(
      runQuery([
        Has(IsKill),
        HasValue(TargetID, { value: kami.id }),
      ])
    );

    for (let i = 0; i < killEntityIndices.length; i++) {
      deaths.push(getKill(layers, killEntityIndices[i], { source: true }));
    }
    deaths.sort((a, b) => b.time - a.time);

    kami.deaths = deaths;
  }

  // populate Kills where our kami is the aggressor
  if (options?.kills) {
    const kills: Kill[] = [];
    const killEntityIndices = Array.from(
      runQuery([
        Has(IsKill),
        HasValue(SourceID, { value: kami.id }),
      ])
    );

    for (let i = 0; i < killEntityIndices.length; i++) {
      kills.push(getKill(layers, killEntityIndices[i], { target: true }));
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
      kami.production = getProduction(layers, productionIndex, { node: true });
  }

  // populate Skills
  if (options?.skills) {
    kami.skills = getSkills(layers, kami.id);
  }

  // populate Traits
  if (options?.traits) {
    // gets registry entity for a trait
    const traitPointer = (type: Component) => {
      const traitIndex = getComponentValue(type, entityIndex)?.value as number;
      return Array.from(
        runQuery([
          Has(TraitIndex),
          HasValue(type, { value: traitIndex }),
        ])
      )[0];
    }

    // adding traits
    const backgroundIndex = traitPointer(BackgroundIndex);
    const bodyIndex = traitPointer(BodyIndex);
    const colorIndex = traitPointer(ColorIndex);
    const faceIndex = traitPointer(FaceIndex);
    const handIndex = traitPointer(HandIndex);

    const traitIndices: TraitIndices = {
      backgroundIndex,
      bodyIndex,
      colorIndex,
      faceIndex,
      handIndex,
    }
    kami.traits = getTraits(layers, traitIndices);

    // adding affinities
    kami.affinities = [
      kami.traits.body.affinity,
      kami.traits.hand.affinity,
    ]
  }

  /////////////////
  // ADJUSTMENTS
  // TODO: move these over to functions.ts now that we've standardized calcs

  // experience threshold calculation according to level
  if (kami.level) {
    const experienceBase = getConfigFieldValue(layers.network, 'KAMI_LVL_REQ_BASE');
    const experienceExponent = getConfigFieldValue(layers.network, 'KAMI_LVL_REQ_MULT_BASE');
    const exponentPrecision = 10 ** getConfigFieldValue(layers.network, 'KAMI_LVL_REQ_MULT_BASE_PREC');
    kami.experience.threshold = Math.floor(experienceBase * ((1.0 * experienceExponent / exponentPrecision) ** (kami.level - 1)));
  }

  // health change rate for harvesting/resting kami
  let healthRate = 0;
  if (kami.state === 'HARVESTING') {
    let productionRate = 0;
    if (kami.production) productionRate = kami.production.rate;
    const drainBase = getConfigFieldValue(layers.network, 'HEALTH_RATE_DRAIN_BASE');
    const drainBasePrecision = 10 ** getConfigFieldValue(layers.network, 'HEALTH_RATE_DRAIN_BASE_PREC');
    const multiplier = kami.bonuses.harvest.drain;
    healthRate = -1 * productionRate * drainBase * multiplier / (1000 * drainBasePrecision);
  } else if (kami.state === 'RESTING') {
    const harmony = kami.stats.harmony + kami.bonusStats.harmony;
    const healBase = getConfigFieldValue(layers.network, 'HEALTH_RATE_HEAL_BASE');
    const healBasePrecision = 10 ** getConfigFieldValue(layers.network, 'HEALTH_RATE_HEAL_BASE_PREC');
    healthRate = harmony * healBase / (3600 * healBasePrecision)
  }
  kami.healthRate = healthRate;

  return kami;
};