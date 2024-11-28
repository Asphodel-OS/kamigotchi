import { EntityIndex, Has, World, getComponentValue, runQuery } from '@mud-classic/recs';

import { Affinity } from 'constants/affinities';
import { Components } from 'network/';
import { NullStats, Stats, getStats } from './Stats';
import { getEntityByHash } from './utils';

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

export const NullTrait: Trait = {
  name: '',
  affinity: Affinity.Normal,
  rarity: 0,
  stats: NullStats,
};

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
  type: string
): Trait => {
  const entityIndex = getRegistryEntity(world, index, type);
  if (!entityIndex) return NullTrait;

  return getTrait(world, components, entityIndex);
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

// get the traits of a kami entity
export const getKamiTraits = (
  world: World,
  components: Components,
  entity: EntityIndex
): Traits => {
  const { BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;

  const backgroundIndex = getComponentValue(BackgroundIndex, entity)?.value as number;
  const bodyIndex = getComponentValue(BodyIndex, entity)?.value as number;
  const colorIndex = getComponentValue(ColorIndex, entity)?.value as number;
  const faceIndex = getComponentValue(FaceIndex, entity)?.value as number;
  const handIndex = getComponentValue(HandIndex, entity)?.value as number;

  return {
    background: getTraitByIndex(world, components, backgroundIndex, 'BACKGROUND'),
    body: getTraitByIndex(world, components, bodyIndex, 'BODY'),
    color: getTraitByIndex(world, components, colorIndex, 'COLOR'),
    face: getTraitByIndex(world, components, faceIndex, 'FACE'),
    hand: getTraitByIndex(world, components, handIndex, 'HAND'),
  };
};

function getRegistryEntity(world: World, index: number, type: string): EntityIndex | undefined {
  return getEntityByHash(world, ['registry.trait', type, index], ['string', 'string', 'uint32']);
}
