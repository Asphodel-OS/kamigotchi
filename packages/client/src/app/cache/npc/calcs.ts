import { formatItemBalance } from 'network/shapes/Item';
import { Listing } from 'network/shapes/Listing';

// calculate the buy price of a listing based on amt purchased
export const calcBuyPrice = (listing: Listing, amt: number) => {
  if (!listing.buy || amt == 0) return 0;
  const pricing = listing.buy;
  const type = pricing.type;
  const value = formatItemBalance(listing.payItem, listing.value); // handle ERC20 decimals before calc

  let result = 0;
  if (type === 'FIXED') result = value * amt;
  else if (type === 'GDA') result = calcBuyPriceGDA(listing, amt);
  else console.warn('calcBuyPrice(): invalid pricing type', pricing);

  return result;
};

// assume we are processing a listing with a GDA-based buy price
export const calcBuyPriceGDA = (listing: Listing, amt: number) => {
  const pricing = listing.buy!;

  const value = formatItemBalance(listing.payItem, listing.value);
  const now = Date.now() / 1000;
  const period = pricing?.period ?? 3600.0;
  const decay = pricing?.decay ?? 0.0;
  const rate = pricing?.rate ?? 0.0;
  const prevSold = listing.balance;

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
  const value = formatItemBalance(listing.payItem, listing.value); // handle ERC20 decimals before calc

  let result = 0;
  if (pricing.type === 'FIXED') {
    result = value * amt;
  } else if (pricing.type === 'SCALED') {
    const scale = pricing?.scale ?? 0;
    result = scale * calcBuyPrice(listing, amt);
  } else console.warn('calcSellPrice(): invalid pricing type', pricing);

  return result;
};
