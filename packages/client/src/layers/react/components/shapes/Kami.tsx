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
import { Production, getProduction } from './Production';
import { Stats, getStats } from './Stats';
import { Trait, getTrait } from './Trait';

// standardized shape of a Kami Entity
export interface Kami {
  id: EntityID;
  index: string;
  name: string;
  uri: string;
  health: number;
  lastUpdated: number;
  account?: Account;
  production?: Production;
  stats: Stats;
  background?: Trait;
  body?: Trait;
  color?: Trait;
  face?: Trait;
  hand?: Trait;
  affinities?: string[];
}

// optional data to populate for a Kami Entity
export interface KamiOptions {
  account?: boolean;
  production?: boolean;
  traits?: boolean;
}

// get a Kami from its EnityIndex. includes options for which data to include
export const getKami = (
  layers: Layers,
  index: EntityIndex,
  options?: KamiOptions
): Kami => {
  const {
    network: {
      world,
      components: {
        AccountID,
        BackgroundIndex,
        BodyIndex,
        ColorIndex,
        FaceIndex,
        HealthCurrent,
        HandIndex,
        IsProduction,
        LastActionTime,
        MediaURI,
        Name,
        PetID,
        PetIndex,
        TraitIndex,
      },
    },
  } = layers;

  // populate the base Kami data
  let kami: Kami = {
    id: world.entities[index],
    index: getComponentValue(PetIndex, index)?.value as string,
    name: getComponentValue(Name, index)?.value as string,
    uri: getComponentValue(MediaURI, index)?.value as string,
    health: getComponentValue(HealthCurrent, index)?.value as number,
    lastUpdated: getComponentValue(LastActionTime, index)?.value as number,
    stats: getStats(layers, index),
  };

  /////////////////
  // OPTIONAL DATA

  if (!options) return kami;

  // populate Account
  if (options.account) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
    const accountIndex = world.entityToIndex.get(accountID);
    if (accountIndex) kami.account = getAccount(layers, accountIndex);
  }

  // populate Production
  if (options.production) {
    const productionIndex = Array.from(
      runQuery([Has(IsProduction), HasValue(PetID, { value: kami.id })])
    )[0];
    if (productionIndex)
      kami.production = getProduction(layers, productionIndex, { node: true });
  }

  // populate Traits
  if (options.traits) {
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
    kami.background = getTrait(layers, traitPointer(BackgroundIndex));
    kami.body = getTrait(layers, traitPointer(BodyIndex));
    kami.color = getTrait(layers, traitPointer(ColorIndex));
    kami.face = getTrait(layers, traitPointer(FaceIndex));
    kami.hand = getTrait(layers, traitPointer(HandIndex));

    // adding affinities
    kami.affinities = [
      kami.body.affinity,
      kami.hand.affinity,
      kami.face.affinity,
    ]
  }

  return kami;
};
