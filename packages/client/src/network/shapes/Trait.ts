import { EntityIndex, Has, World, getComponentValue, runQuery } from '@mud-classic/recs';

import { Affinity } from 'constants/affinities';
import { Components } from 'network/';
import { NullStats, Stats, getStats } from './Stats';
import { getEntityByHash } from './utils';

// standardized shape of Traits on an Entity
export interface Trait {
  entity: EntityIndex; // entity index of the kami
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
  entity: 0 as EntityIndex,
  name: '',
  affinity: Affinity.Normal,
  rarity: 0,
  stats: NullStats,
};

export interface TraitEntities {
  background: EntityIndex;
  body: EntityIndex;
  color: EntityIndex;
  face: EntityIndex;
  hand: EntityIndex;
}

// get the Stats from the EnityIndex of a Kami
// feed in the trait registry entity
export const getTrait = (world: World, components: Components, entity: EntityIndex): Trait => {
  const { Affinity, Name, Rarity } = components;
  return {
    entity,
    name: getComponentValue(Name, entity)?.value || ('' as string),
    affinity: (getComponentValue(Affinity, entity)?.value ?? '') as Affinity,
    rarity: getComponentValue(Rarity, entity)?.value || (0 as number),
    stats: getStats(world, components, entity),
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

// get all the Traits from the registry
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

// get the Traits object from a TraitEntities object of EntityIndices
export const getTraits = (world: World, components: Components, indices: TraitEntities): Traits => {
  return {
    background: getTrait(world, components, indices.background),
    body: getTrait(world, components, indices.body),
    color: getTrait(world, components, indices.color),
    face: getTrait(world, components, indices.face),
    hand: getTrait(world, components, indices.hand),
  };
};

// get the traits of a kami entity
export const getKamiTraits = (
  world: World,
  components: Components,
  entity: EntityIndex
): Traits => {
  const traitEntities = queryTraitsForKami(world, components, entity);
  return getTraits(world, components, traitEntities);
};

// query for the trait registry entities for a kami entity
export const queryTraitsForKami = (world: World, components: Components, entity: EntityIndex) => {
  const { BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;
  const backgroundIndex = getComponentValue(BackgroundIndex, entity)?.value as number;
  const bodyIndex = getComponentValue(BodyIndex, entity)?.value as number;
  const colorIndex = getComponentValue(ColorIndex, entity)?.value as number;
  const faceIndex = getComponentValue(FaceIndex, entity)?.value as number;
  const handIndex = getComponentValue(HandIndex, entity)?.value as number;

  return {
    background: getRegistryEntity(world, backgroundIndex, 'BACKGROUND'),
    body: getRegistryEntity(world, bodyIndex, 'BODY'),
    color: getRegistryEntity(world, colorIndex, 'COLOR'),
    face: getRegistryEntity(world, faceIndex, 'FACE'),
    hand: getRegistryEntity(world, handIndex, 'HAND'),
  };
};

function getRegistryEntity(world: World, index: number, type: string): EntityIndex {
  return getEntityByHash(
    world,
    ['registry.trait', type, index],
    ['string', 'string', 'uint32']
  ) as EntityIndex;
}
