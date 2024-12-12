import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { genRef, getEntityByHash, hashArgs } from '../utils';

export const getRegEntityIndex = (world: World, itemIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.item', itemIndex], ['string', 'uint32']);
};

export const getItemReqAnchorID = (itemIndex: number, usecase: string): EntityID => {
  const usecaseID = genRef(usecase, getItemRefParentID(itemIndex));
  return hashArgs(['item.requirement', usecaseID], ['string', 'uint256']);
};

export const getItemAlloAnchorID = (itemIndex: number, usecase: string): EntityID => {
  const usecaseID = genRef(usecase, getItemRefParentID(itemIndex));
  return hashArgs(['item.allo', usecaseID], ['string', 'uint256']);
};

const getItemRefParentID = (itemIndex: number): EntityID => {
  return hashArgs(['item.usecase', itemIndex], ['string', 'uint32']);
};
