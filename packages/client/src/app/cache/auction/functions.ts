import { Auction } from 'network/shapes/Auction';

// calculate the buy price of a listing based on amt purchased
// NOTE: this may need to be updated to support 256 bit math
export const calcPrice = (auction: Auction, amt: number) => {
  if (!auction.auctionItem?.index || amt <= 0) return 0;
  const value = auction.params.value;
  const period = auction.params.period;
  const decay = auction.params.decay;
  const rate = auction.params.rate;
  const prevSold = auction.supply.sold;

  const tDelta = (Date.now() / 1000 - auction.time.start) / period;

  let price = value * decay ** (tDelta - prevSold / rate);
  if (amt > 1) {
    const scale = decay ** (-1 / rate);
    const num = scale ** amt - 1.0;
    const den = scale - 1.0;
    price = (price * num) / den;
  }

  return Math.ceil(price);
};
