import {
  Component,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Affinity } from 'constants/affinities';
import { Components } from 'network/';
import { Stats, getStats } from './Stats';

// standardized shape of Traits on an Entity
export interface Trait {
  name: string;
  affinity: Affinity;
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

export interface TraitEntities {
  backgroundIndex: EntityIndex;
  bodyIndex: EntityIndex;
  colorIndex: EntityIndex;
  faceIndex: EntityIndex;
  handIndex: EntityIndex;
}

// get the Stats from the EnityIndex of a Kami
// feed in the trait registry entity
export const getTrait = (world: World, components: Components, entityIndex: EntityIndex): Trait => {
  const { Affinity, Name, Rarity } = components;

  return {
    name: getComponentValue(Name, entityIndex)?.value || ('' as string),
    affinity: (getComponentValue(Affinity, entityIndex)?.value ?? '') as Affinity,
    rarity: getComponentValue(Rarity, entityIndex)?.value || (0 as number),
    stats: getStats(world, components, entityIndex),
  };
};

export const getTraitByIndex = (
  world: World,
  components: Components,
  index: number,
  type?: string
): Trait => {
  const { IsRegistry, BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;

  const getPointer = (type: Component) => {
    return Array.from(runQuery([Has(IsRegistry), HasValue(type, { value: index })]))[0];
  };

  if (type === 'BODY') return getTrait(world, components, getPointer(BodyIndex));
  else if (type === 'BACKGROUND') return getTrait(world, components, getPointer(BackgroundIndex));
  else if (type === 'COLOR') return getTrait(world, components, getPointer(ColorIndex));
  else if (type === 'FACE') return getTrait(world, components, getPointer(FaceIndex));
  else if (type === 'HAND') return getTrait(world, components, getPointer(HandIndex));

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
  return entityIndices.map((index) => getTrait(world, components, index));
};

export const getTraits = (world: World, components: Components, indices: TraitEntities): Traits => {
  return {
    background: getTrait(world, components, indices.backgroundIndex),
    body: getTrait(world, components, indices.bodyIndex),
    color: getTrait(world, components, indices.colorIndex),
    face: getTrait(world, components, indices.faceIndex),
    hand: getTrait(world, components, indices.handIndex),
  };
};

// get the traits of a kami entity
export const getKamiTraits = (
  world: World,
  components: Components,
  entity: EntityIndex
): Traits => {
  const { IsRegistry, BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;

  const getTraitPointer = (type: Component) => {
    const traitIndex = getComponentValue(type, entity)?.value as number;
    return Array.from(runQuery([Has(IsRegistry), HasValue(type, { value: traitIndex })]))[0];
  };

  const traitIndices: TraitEntities = {
    backgroundIndex: getTraitPointer(BackgroundIndex),
    bodyIndex: getTraitPointer(BodyIndex),
    colorIndex: getTraitPointer(ColorIndex),
    faceIndex: getTraitPointer(FaceIndex),
    handIndex: getTraitPointer(HandIndex),
  };
  return getTraits(world, components, traitIndices);
};
