import { EntityID, EntityIndex } from '@mud-classic/recs';

import { getEntityByHash, hashArgs } from '../utils';

// standardized Object shape of a Score Entity
export interface Score {
  holderID: EntityID;
  value: number;
}

export interface ScoresFilter {
  epoch: number;
  index: number;
  type: string;
}

export const getEntity = (
  world: any,
  holderID: EntityID,
  epoch: number,
  index: number,
  field: string
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['is.score', holderID, epoch, index, field],
    ['string', 'uint256', 'uint256', 'uint32', 'string']
  );
};

export const getType = (epoch: number, index: number, type: string): EntityID => {
  return hashArgs(['score.type', epoch, index, type], ['uint256', 'uint32', 'string'], true);
};
