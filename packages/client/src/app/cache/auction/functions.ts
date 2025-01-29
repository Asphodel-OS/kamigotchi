import { Auction } from 'network/shapes/Auction';

// calculate the buy price of a listing based on amt purchased
// NOTE: this may need to be updated to support 256 bit math
export const calcPrice = (auction: Auction, amt: number) => {
  const value = auction.params.value;
  const decay = auction.params.decay;
  const scale = auction.params.scale;
  const prevSold = auction.supply.sold;
  const tDelta = Date.now() / 1000 - auction.time.reset;

  const num1 = value * scale ** prevSold;
  const num2 = scale ** amt - 1.0;
  const den1 = Math.exp(decay * tDelta);
  const den2 = scale - 1.0;
  const priceRaw = (num1 * num2) / (den1 * den2);
  return Math.ceil(priceRaw);
};
