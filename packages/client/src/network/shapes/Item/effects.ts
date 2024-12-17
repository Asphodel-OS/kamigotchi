import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { Allo, getAllosOf } from '../Allo';
import { genRef, hashArgs } from '../utils';
import { genRefParentID } from './utils';

export interface Effects {
  // burn: Allo[];
  // craft: Allo[];
  use: Allo[];
}

export const getEffects = (world: World, comps: Components, index: number): Effects => {
  return {
    use: getActionAllos(world, comps, index, 'USE'),
  };
};

export const getActionAllos = (
  world: World,
  comps: Components,
  index: number,
  action: string
): Allo[] => {
  const parentID = genAlloAnchor(index, action);
  return getAllosOf(world, comps, parentID);
};

export const genAlloAnchor = (index: number, action: string): EntityID => {
  const actionID = genRef(action, genRefParentID(index));
  return hashArgs(['item.allo', actionID], ['string', 'uint256']);
};
