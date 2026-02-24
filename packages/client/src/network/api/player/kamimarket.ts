import { SystemQueue } from 'engine/queue';
import { BigNumberish } from 'ethers';

export const kamiMarketAPI = (systems: SystemQueue<any>) => {
  // create order (sell)
  function list(kamiIndex: number, price: BigNumberish, expiry: BigNumberish) {
    return systems['system.kamimarket.list'].executeTyped(kamiIndex, price, expiry);
  }

  // buy a kami from a listing
  function buy(listingIDs: BigNumberish[], totalPrice: BigNumberish) {
    return systems['system.kamimarket.buy'].executeTyped(listingIDs, { value: totalPrice });
  }

  // cancel your own order
  function cancel(id: BigNumberish) {
    return systems['system.kamimarket.cancel'].executeTyped(id);
  }

  // create order (buy) on an specific kami,
  // wont be using this one at least for now
  function offer(kamiIndex: number, price: BigNumberish, expiry: BigNumberish) {
    return systems['system.kamimarket.offer'].executeTypedOffer(kamiIndex, price, expiry);
  }

  // create order (buy)
  //  TODO:add expiry to create order buy
  function offerCollection(price: BigNumberish, quantity: number, expiry: BigNumberish) {
    return systems['system.kamimarket.offer'].executeTypedCollection(price, quantity, expiry);
  }

  // sell your kami on a bid
  function acceptOffer(offerID: BigNumberish, kamiIndex: number) {
    return systems['system.kamimarket.acceptoffer'].executeTyped(offerID, kamiIndex);
  }

  // sell multiple kamis on a single bid in one tx
  function acceptOfferBatch(offerID: BigNumberish, kamiIndices: number[]) {
    return systems['system.kamimarket.acceptoffer'].executeTyped(offerID, kamiIndices);
  }

  return {
    list,
    buy,
    cancel,
    offer,
    offerCollection,
    acceptOffer,
    acceptOfferBatch,
  };
};
