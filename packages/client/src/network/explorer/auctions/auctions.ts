import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllAuctions, getAuction, getAuctionByIndex } from 'network/shapes/Auction';
import { getAuctionPrices } from './pricing';

const AuctionOptions = { auctionItem: true, paymentItem: true };
export const auctions = (world: World, components: Components) => {
  return {
    all: () => getAllAuctions(world, components, AuctionOptions),
    get: (entity: EntityIndex) => getAuction(world, components, entity, AuctionOptions),
    getByIndex: (index: number) => getAuctionByIndex(world, components, index, AuctionOptions),
    getPrices: () => {
      const auctions = getAllAuctions(world, components, AuctionOptions);
      return getAuctionPrices(auctions);
    },
  };
};
