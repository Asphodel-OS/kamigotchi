import { Auction } from 'network/shapes/Auction';

// calculate the cost to buy N items from an auction Now
export const calcCost = (auction: Auction, amt: number) => {
  if (amt <= 0) return 0;
  const now = Date.now() / 1000;
  const prevSold = auction.supply.sold;
  return calcPrice(auction, now, prevSold, amt);
};

// calculate the price of the auction at a given time and balance sold
// used primarily to calculate price history
// NOTE: this may need to be updated to support 256 bit math
export const calcPrice = (auction: Auction, time: number, prevSold: number, amt = 1) => {
  if (!auction.auctionItem?.index) return 0;
  const value = auction.params.value;
  const period = auction.params.period;
  const decay = auction.params.decay;
  const rate = auction.params.rate;

  const tDelta = (time - auction.time.start) / period;

  let price = value * decay ** (tDelta - prevSold / rate);
  if (amt > 1) {
    const scale = decay ** (-1 / rate);
    const num = scale ** amt - 1.0;
    const den = scale - 1.0;
    price = (price * num) / den;
  }

  return Math.ceil(price);
};
