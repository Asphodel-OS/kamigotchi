import { EntityIndex, Has, World, getComponentValue, runQuery } from '@mud-classic/recs';

import { Affinity } from 'constants/affinities';
import { Components } from 'network/';
import { NullStats, Stats, getStats } from './Stats';
import { getEntityByHash } from './utils';
import { getAffinity, getName, getRarity } from './utils/component';

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
export const getTrait = (world: World, comps: Components, entity: EntityIndex): Trait => {
  return {
    entity,
    name: getName(comps, entity),
    affinity: getAffinity(comps, entity),
    rarity: getRarity(comps, entity),
    stats: getStats(world, comps, entity),
  };
};

export const getTraitByIndex = (
  world: World,
  comps: Components,
  index: number,
  type: string
): Trait => {
  const entity = getRegistryEntity(world, index, type);
  if (!entity) return NullTrait;

  return getTrait(world, comps, entity);
};

// get all the Traits from the registry
export const getRegistryTraits = (world: World, comps: Components): Trait[] => {
  const { IsRegistry, BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = comps;

  const entityIndices = [
    ...Array.from(runQuery([Has(IsRegistry), Has(BackgroundIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(BodyIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(ColorIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(FaceIndex)])),
    ...Array.from(runQuery([Has(IsRegistry), Has(HandIndex)])),
  ];
  return entityIndices.map((index) => getTrait(world, comps, index));
};

// get the Traits object from a TraitEntities object of EntityIndices
export const getTraits = (world: World, comps: Components, indices: TraitEntities): Traits => {
  return {
    background: getTrait(world, comps, indices.background),
    body: getTrait(world, comps, indices.body),
    color: getTrait(world, comps, indices.color),
    face: getTrait(world, comps, indices.face),
    hand: getTrait(world, comps, indices.hand),
  };
};

// query for the trait registry entities for a kami entity
export const queryTraitsForKami = (world: World, comps: Components, entity: EntityIndex) => {
  const { BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = comps;
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
