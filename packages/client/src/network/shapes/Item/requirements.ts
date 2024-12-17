import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Condition, queryConditionsOfID } from '../Conditional';
import { genRef, hashArgs } from '../utils';
import { genRefParentID } from './utils';

export interface Requirements {
  // burn: Condition[];
  // craft: Condition[];
  use: Condition[];
}

export const getRequirements = (world: World, comps: Components, index: number): Requirements => {
  return {
    use: getActionRequirements(world, comps, index, 'USE'),
  };
};

export const getActionRequirements = (
  world: World,
  comps: Components,
  index: number,
  action: string
): Condition[] => {
  const parentID = genRequirementAnchor(index, action);
  return queryConditionsOfID(world, comps, parentID);
};

export const genRequirementAnchor = (index: number, action: string): EntityID => {
  const actionID = genRef(action, genRefParentID(index));
  return hashArgs(['item.requirement', actionID], ['string', 'uint256']);
};
