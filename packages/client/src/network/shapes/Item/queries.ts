import { EntityIndex, World } from '@mud-classic/recs';

import { getEntityByHash } from '../utils';

export const queryByIndex = (world: World, itemIndex: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.item', itemIndex], ['string', 'uint32']);
};
