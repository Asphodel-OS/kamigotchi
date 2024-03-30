import { EntityIndex, Has, HasValue, World, getComponentValue, runQuery } from '@mud-classic/recs';

import { Components } from 'layers/network';
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
export const getTrait = (components: Components, entityIndex: EntityIndex): Trait => {
  const { Affinity, Name, Rarity } = components;

  return {
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    affinity: getComponentValue(Affinity, entityIndex)?.value || ('' as string),
    rarity: getComponentValue(Rarity, entityIndex)?.value || (0 as number),
    stats: getStats(components, entityIndex),
  };
};

export const getTraitByIndex = (world: World, components: Components, index: number): Trait => {
  const { IsRegistry, TraitIndex } = components;

  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(TraitIndex, { value: index })])
  );
  return getTrait(components, entityIndices[0]);
};

export const getRegistryTraits = (world: World, components: Components): Trait[] => {
  const { IsRegistry, TraitIndex } = components;

  const entityIndices = Array.from(runQuery([Has(IsRegistry), Has(TraitIndex)]));
  return entityIndices.map((index) => getTrait(components, index));
};

export const getTraits = (world: World, components: Components, indices: TraitIndices): Traits => {
  return {
    background: getTrait(components, indices.backgroundIndex),
    body: getTrait(components, indices.bodyIndex),
    color: getTrait(components, indices.colorIndex),
    face: getTrait(components, indices.faceIndex),
    hand: getTrait(components, indices.handIndex),
  };
};
