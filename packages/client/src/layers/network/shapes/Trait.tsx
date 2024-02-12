import {
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Stats, getStats } from './Stats';
import { NetworkLayer } from 'layers/network/types';

// standardized shape of Traits on an Entity
export interface Trait {
  name: string;
  affinity: string;
  rarity: number;
  stats: Stats;
}

export interface Traits {
  background: Trait;
  body: Trait;
  color: Trait;
  face: Trait;
  hand: Trait;
}

export interface TraitIndices {
  backgroundIndex: EntityIndex;
  bodyIndex: EntityIndex;
  colorIndex: EntityIndex;
  faceIndex: EntityIndex;
  handIndex: EntityIndex;
}

// get the Stats from the EnityIndex of a Kami
// feed in the trait registry entity
export const getTrait = (
  network: NetworkLayer,
  entityIndex: EntityIndex
): Trait => {
  const { Affinity, Name, Rarity } = network.components;

  return {
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    affinity: getComponentValue(Affinity, entityIndex)?.value || ('' as string),
    rarity: getComponentValue(Rarity, entityIndex)?.value || (0 as number),
    stats: getStats(network, entityIndex),
  };
};

export const getTraitByIndex = (
  network: NetworkLayer,
  index: number
): Trait => {
  const { IsRegistry, TraitIndex } = network.components;

  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(TraitIndex, { value: index })])
  );
  return getTrait(network, entityIndices[0]);
};

export const getTraits = (
  network: NetworkLayer,
  indices: TraitIndices
): Traits => {
  return {
    background: getTrait(network, indices.backgroundIndex),
    body: getTrait(network, indices.bodyIndex),
    color: getTrait(network, indices.colorIndex),
    face: getTrait(network, indices.faceIndex),
    hand: getTrait(network, indices.handIndex),
  };
};
