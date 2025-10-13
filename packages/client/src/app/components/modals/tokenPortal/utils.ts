import { PortalConfigs } from 'app/cache/config';
import { playClick } from 'utils/sounds';

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

// open the link to Baseline Markets ONYX listing
export const openBaselineLink = (address: string) => {
  window.open(`https://app.baseline.markets/trade/yominet/${address}`, '_blank');
  playClick();
};
