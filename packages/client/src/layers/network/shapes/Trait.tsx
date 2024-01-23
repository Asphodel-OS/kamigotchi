import {
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Stats, getStats } from './Stats';

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
export const getTrait = (layers: Layers, entityIndex: EntityIndex): Trait => {
  const {
    network: {
      components: {
        Affinity,
        Name,
        Rarity,
      },
    },
  } = layers;

  return {
    name: getComponentValue(Name, entityIndex)?.value || '' as string,
    affinity: getComponentValue(Affinity, entityIndex)?.value || '' as string,
    rarity: getComponentValue(Rarity, entityIndex)?.value || 0 as number,
    stats: getStats(layers, entityIndex),
  };
}

export const getTraitByIndex = (layers: Layers, index: number): Trait => {
  const {
    network: {
      components: {
        IsRegistry,
        TraitIndex,
      },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(TraitIndex, { value: index })
    ])
  );
  return getTrait(layers, entityIndices[0]);
}

export const getTraits = (layers: Layers, indices: TraitIndices): Traits => {
  return {
    background: getTrait(layers, indices.backgroundIndex),
    body: getTrait(layers, indices.bodyIndex),
    color: getTrait(layers, indices.colorIndex),
    face: getTrait(layers, indices.faceIndex),
    hand: getTrait(layers, indices.handIndex),
  };
}