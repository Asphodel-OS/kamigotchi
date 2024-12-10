import { EntityID, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryChildrenOf } from '../utils';
import { queryBonusForType } from './queries';
import { Bonus, getBonus, getBonusValueSingle } from './types';

export const getBonusValue = (
  world: World,
  components: Components,
  field: string,
  holderID: EntityID,
  precision: number = 0
): number => {
  const values = getBonusValuesForType(world, components, field, holderID, precision);
  return values.reduce((acc, curr) => acc + curr, 0);
};

export const getBonusValuesForType = (
  world: World,
  components: Components,
  field: string,
  holderID: EntityID,
  precision: number = 0
): number[] => {
  const instances = queryBonusForType(components, field, holderID);
  return instances.map((instance) => getBonusValueSingle(world, components, instance, precision));
};

export const getBonusesByParent = (
  world: World,
  components: Components,
  parentID: EntityID
): Bonus[] => {
  return queryChildrenOf(components, parentID).map((instance) =>
    getBonus(world, components, instance)
  );
};
