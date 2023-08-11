import {
  Component,
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account, getAccount } from './Account';
import { getConfigFieldValue } from './Config';
import { Kill, getKill } from './Kill';
import { Production, getProduction } from './Production';
import { Stats, getStats } from './Stats';
import { Traits, TraitIndices, getTraits } from './Trait';

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
  lastUpdated: number;
  cooldown: number;
  stats: Stats;
  account?: Account;
  deaths?: Kill[];
  kills?: Kill[];
  production?: Production;
  traits?: Traits;
  affinities?: string[];
  canName?: boolean;
}

export interface KamiExperience {
  current: number;
  threshold: number;
}

// optional data to populate for a Kami Entity
export interface Options {
  account?: boolean;
  deaths?: boolean;
  kills?: boolean;
  production?: boolean;
  traits?: boolean;
  namable?: boolean;
}

// items to query
export interface QueryOptions {
  account?: EntityID;
  state?: string;
}

// get a Kami from its EnityIndex. includes options for which data to include
export const getKami = (
  layers: Layers,
  index: EntityIndex,
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
        IsKill,
        IsProduction,
        LastTime,
        Level,
        MediaURI,
        Name,
        PetID,
        PetIndex,
        SourceID,
        State,
        TargetID,
        TraitIndex,
      },
    },
  } = layers;

  // populate the base Kami data
  let kami: Kami = {
    id: world.entities[index],
    index: getComponentValue(PetIndex, index)?.value as number,
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    uri: getComponentValue(MediaURI, index)?.value as string,
    level: getComponentValue(Level, index)?.value as number,
    experience: {
      current: getComponentValue(Experience, index)?.value as number,
      threshold: 0,
    },
    health: getComponentValue(HealthCurrent, index)?.value as number,
    healthRate: 0,
    state: getComponentValue(State, index)?.value as string,
    lastUpdated: getComponentValue(LastTime, index)?.value as number,
    cooldown: getConfigFieldValue(layers.network, 'KAMI_IDLE_REQ'),
    stats: getStats(layers, index),
  };

  /////////////////
  // OPTIONAL DATA

  // populate Account
  if (options?.account) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
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

  // populate Traits
  if (options?.traits) {
    // gets registry entity for a trait
    const traitPointer = (type: Component) => {
      const traitIndex = getComponentValue(type, index)?.value as number;
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

  // check if canName
  if (options?.namable) {
    if (getComponentValue(CanName, index)) {
      kami.canName = true;
    } else {
      kami.canName = false;
    }
  }

  /////////////////
  // ADJUSTMENTS

  // experience threshold calculation according to level
  if (kami.level) {
    const experienceBase = getConfigFieldValue(layers.network, 'KAMI_LVL_REQ_BASE');
    const experienceExponent = getConfigFieldValue(layers.network, 'KAMI_LVL_REQ_EXP');
    const exponentPrecision = 10 ** getConfigFieldValue(layers.network, 'KAMI_LVL_REQ_EXP_PREC');
    kami.experience.threshold = Math.floor(experienceBase * ((1.0 * experienceExponent / exponentPrecision) ** (kami.level - 1)));
  }

  // health change rate for harvesting/resting kami
  let healthRate = 0;
  if (kami.state === 'HARVESTING') {
    let productionRate = 0;
    if (kami.production) productionRate = kami.production.rate;
    const drainBase = getConfigFieldValue(layers.network, 'HEALTH_RATE_DRAIN_BASE');
    const drainBasePrecision = 10 ** getConfigFieldValue(layers.network, 'HEALTH_RATE_DRAIN_BASE_PREC');
    healthRate = -1 * productionRate * drainBase / drainBasePrecision;
  } else if (kami.state === 'RESTING') {
    const harmony = kami.stats.harmony;
    const healBase = getConfigFieldValue(layers.network, 'HEALTH_RATE_HEAL_BASE');
    const healBasePrecision = 10 ** getConfigFieldValue(layers.network, 'HEALTH_RATE_HEAL_BASE_PREC');
    healthRate = harmony * healBase / (3600 * healBasePrecision)
  }
  kami.healthRate = healthRate;

  return kami;
};

export const queryKamisX = (
  layers: Layers,
  options: QueryOptions,
  kamiOptions?: Options
): Kami[] => {
  const {
    network: {
      components: {
        AccountID,
        IsPet,
        State,
      },
    },
  } = layers;

  const toQuery: QueryFragment[] = [Has(IsPet)];

  if (options?.account) {
    toQuery.push(HasValue(AccountID, { value: options.account }));
  }

  if (options?.state) {
    toQuery.push(HasValue(State, { value: options.state }));
  }

  const kamiIDs = Array.from(
    runQuery(toQuery)
  );

  return kamiIDs.map(
    (index): Kami => getKami(
      layers,
      index,
      kamiOptions
    )
  );;
};