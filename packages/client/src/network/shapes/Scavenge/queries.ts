import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { getEntityByHash, hashArgs } from '../utils';

export const queryRegistry = (
  world: World,
  type: string,
  index: number
): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.scavenge', type, index], ['string', 'string', 'uint32']);
};

export const queryInstance = (
  world: World,
  type: string,
  index: number,
  holderID: EntityID
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['scavenge.instance', type, index, holderID],
    ['string', 'string', 'uint32', 'uint256']
  );
};

// get the ID of the Reward Anchor virtual entity
export const queryRewardAnchor = (regID: EntityID): EntityID => {
  return hashArgs(['scavenge.reward', regID], ['string', 'uint256'], true);
};
