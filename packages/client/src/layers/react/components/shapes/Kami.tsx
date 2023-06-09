import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
  Component,
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
  index: string;
  entityIndex: EntityIndex;
  name: string;
  uri: string;
  health: number;
  state: string;
  lastUpdated: number;
  stats: Stats;
  account?: Account;
  deaths?: Kill[];
  kills?: Kill[];
  production?: Production;
  traits?: Traits;
  affinities?: string[];
  canName?: boolean;
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
        FaceIndex,
        HealthCurrent,
        HandIndex,
        IsKill,
        IsProduction,
        LastTime,
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
    index: getComponentValue(PetIndex, index)?.value as string,
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    uri: getComponentValue(MediaURI, index)?.value as string,
    health: getComponentValue(HealthCurrent, index)?.value as number,
    state: getComponentValue(State, index)?.value as string,
    lastUpdated: getComponentValue(LastTime, index)?.value as number,
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
      kami.traits.face.affinity,
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

  return kami;
};
