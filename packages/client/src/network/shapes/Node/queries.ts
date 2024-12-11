import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { hashArgs } from '../utils';

// get the entity ID of a Node by its node index
export const indexToID = (index: number): EntityID => {
  return hashArgs(['node', index], ['string', 'uint32']);
};

// query for the entity index of the Node with the given index
export const queryByIndex = (world: World, index: number): EntityIndex => {
  const id = indexToID(index);
  return world.entityToIndex.get(id)!;
};
