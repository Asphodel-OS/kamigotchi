import { Listing } from 'network/shapes/Listing';

// calculate the buy price of a listing based on amt purchased
// TODO: determine rounding rules for erc20 denominations
export const calcBuyPrice = (listing: Listing, amt: number) => {
  if (!listing.buy || amt == 0) return 0;
  const pricing = listing.buy;
  const type = pricing.type;
  const value = listing.value;

  let result = 0;
  if (type === 'FIXED') result = Math.round(value * amt * 100) / 100;
  else if (type === 'GDA') result = calcBuyPriceGDA(listing, amt);
  else console.warn('calcBuyPrice(): invalid pricing type', pricing);

  return result;
};

// assume we are processing a listing with a GDA-based buy price
// TODO: determine rounding rules for erc20 denominations
export const calcBuyPriceGDA = (listing: Listing, amt: number) => {
  const now = Date.now() / 1000;

  const value = listing.value;
  const pricing = listing.buy!;
  const period = pricing?.period;
  const decay = pricing?.decay;
  const rate = pricing?.rate;
  const prevSold = listing.balance;

  if (!period || !decay || !rate) {
    console.warn('calcBuyPriceGDA(): invalid GDA pricing for listing', listing);
    return 0;
  }

  const tDelta = (now - listing.startTime) / period; // # periods

  let price = value * decay ** (tDelta - prevSold / rate);
  if (amt > 1) {
    const scale = decay ** (-1 / rate);
    const num = scale ** amt - 1.0;
    const den = scale - 1.0;
    price = (price * num) / den;
  }

  return Math.ceil(price);
};

// calculate the sell price of a listing based on amt sold
export const calcSellPrice = (listing: Listing, amt: number) => {
  if (!listing.sell || amt == 0) return 0;
  const pricing = listing.sell;
  const value = listing.value;

  let result = 0;
  if (pricing.type === 'FIXED') {
    result = value * amt;
  } else if (pricing.type === 'SCALED') {
    const scale = pricing?.scale ?? 0;
    result = scale * calcBuyPrice(listing, amt);
  } else console.warn('calcSellPrice(): invalid pricing type', pricing);

  return result;
};
