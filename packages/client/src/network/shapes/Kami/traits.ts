import {
  Component,
  EntityIndex,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
  World,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { getTrait, Trait } from '../Trait';

export interface TraitEntities {
  background: EntityIndex;
  body: EntityIndex;
  color: EntityIndex;
  face: EntityIndex;
  hand: EntityIndex;
}

export interface Traits {
  background: Trait;
  body: Trait;
  color: Trait;
  face: Trait;
  hand: Trait;
}

// query for the trait registry entities for a kami entity
export const queryTraits = (components: Components, entity: EntityIndex) => {
  const { IsRegistry, BackgroundIndex, BodyIndex, ColorIndex, FaceIndex, HandIndex } = components;
  const getTraitPointer = (type: Component) => {
    const traitIndex = getComponentValue(type, entity)?.value as number;
    // TODO shortcut this with a registry cache
    return Array.from(runQuery([Has(IsRegistry), HasValue(type, { value: traitIndex })]))[0];
  };

  return {
    background: getTraitPointer(BackgroundIndex),
    body: getTraitPointer(BodyIndex),
    color: getTraitPointer(ColorIndex),
    face: getTraitPointer(FaceIndex),
    hand: getTraitPointer(HandIndex),
  };
};

// get the traits of a kami entity
export const getTraits = (world: World, components: Components, entity: EntityIndex): Traits => {
  const traitEntities = queryTraits(components, entity);
  return {
    background: getTrait(world, components, traitEntities.background),
    body: getTrait(world, components, traitEntities.body),
    color: getTrait(world, components, traitEntities.color),
    face: getTrait(world, components, traitEntities.face),
    hand: getTrait(world, components, traitEntities.hand),
  };
};
