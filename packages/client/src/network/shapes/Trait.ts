import {
  Component,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
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

export const getTraitByIndex = (components: Components, index: number, type?: string): Trait => {
  const { IsRegistry, BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;

  const getPointer = (type: Component) => {
    return Array.from(runQuery([Has(IsRegistry), HasValue(type, { value: index })]))[0];
  };

  if (type === 'BODY') return getTrait(components, getPointer(BodyIndex));
  else if (type === 'BACKGROUND') return getTrait(components, getPointer(BackgroundIndex));
  else if (type === 'COLOR') return getTrait(components, getPointer(ColorIndex));
  else if (type === 'FACE') return getTrait(components, getPointer(FaceIndex));
  else if (type === 'HAND') return getTrait(components, getPointer(HandIndex));

  return {} as Trait; // should not reach here
};

export const getRegistryTraits = (world: World, components: Components): Trait[] => {
  const { IsRegistry, BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;

  const entityIndices = [
    ...Array.from(runQuery([Has(IsRegistry), Has(BackgroundIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(BodyIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(ColorIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(FaceIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(HandIndex)])),
  ];
  return entityIndices.map((index) => getTrait(components, index));
};

export const getTraits = (components: Components, indices: TraitIndices): Traits => {
  return {
    background: getTrait(components, indices.backgroundIndex),
    body: getTrait(components, indices.bodyIndex),
    color: getTrait(components, indices.colorIndex),
    face: getTrait(components, indices.faceIndex),
    hand: getTrait(components, indices.handIndex),
  };
};
