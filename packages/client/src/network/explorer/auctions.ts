import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllAuctions, getAuction, getAuctionByIndex } from 'network/shapes/Auction';

export const auctions = (world: World, components: Components) => {
  return {
    all: () => getAllAuctions(world, components),
    get: (entity: EntityIndex) => getAuction(world, components, entity),
    getByIndex: (index: number) => getAuctionByIndex(world, components, index),
  };
};
