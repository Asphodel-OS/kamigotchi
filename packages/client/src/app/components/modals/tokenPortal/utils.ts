import { PortalConfigs } from 'app/cache/config';
import { Item } from 'network/shapes';

// get the necessary deposit balance to achieve the target balance (in item units)
export const getNeededDeposit = (config: PortalConfigs, target: number) => {
  const { flat, rate } = config.tax.import;
  const needAmt = Math.floor((target + flat) / (1 - rate));
  return needAmt;
};

// get the resulting (post-tax) withdrawal balance from initial (in item units)
export const getResultWithdraw = (config: PortalConfigs, target: number) => {
  const { flat, rate } = config.tax.export;
  const ratedTax = Math.floor(target * rate);
  const amt = target - ratedTax - flat;
  return Math.max(0, amt);
};

// open the link to Baseline Markets ONYX listing. hardcoded for now; the
// caller (IconButton) owns the click sound
export const openBaselineLink = (address: string) => {
  const url = `https://app.baseline.markets/tokens/1/0x80Ea38D56E262457D73c0d8dFe027AE8925821e2`;
  window.open(url, '_blank');
};

// get the balance conversion rate from token to item
export const getSwapRate = (item: Item) => {
  return 10 ** (item.token?.scale ?? 0);
};
