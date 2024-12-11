import { EntityID, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryForParent, queryForType } from './queries';
import { Bonus, getBonus, getBonusValueSingle } from './types';

export const getBonusValue = (
  world: World,
  components: Components,
  field: string,
  holderID: EntityID,
  precision: number = 0
): number => {
  const values = getBonusValuesForType(world, components, field, holderID, precision);
  return values.reduce((sum, curr) => sum + curr, 0);
};

export const getBonusValuesForType = (
  world: World,
  components: Components,
  field: string,
  holderID: EntityID,
  precision: number = 0
): number[] => {
  const entities = queryForType(components, field, holderID);
  return entities.map((entity) => getBonusValueSingle(world, components, entity, precision));
};

export const getBonusesByParent = (
  world: World,
  components: Components,
  parentID: EntityID
): Bonus[] => {
  const entities = queryForParent(components, parentID);
  return entities.map((entity) => getBonus(world, components, entity));
};
