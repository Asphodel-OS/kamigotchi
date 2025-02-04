import { Auction } from 'network/shapes/Auction';

// calculate the buy price of a listing based on amt purchased
// NOTE: this may need to be updated to support 256 bit math
export const calcPrice = (auction: Auction, amt: number) => {
  const value = auction.params.value;
  const period = auction.params.period;
  const decay = auction.params.decay;
  const rate = auction.params.rate;
  const prevSold = auction.supply.sold;
  const tDelta = (Date.now() / 1000 - auction.time.start) / period;

  const num1 = value * decay ** (tDelta - prevSold / rate);
  const num2 = decay ** (-amt / rate) - 1.0;
  const den1 = decay ** -1.0 - 1.0;
  const priceRaw = (num1 * num2) / den1;
  return Math.ceil(priceRaw);
};
