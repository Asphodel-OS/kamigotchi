import { Trade } from 'network/shapes/Trade/types';
import { isItemCurrency } from '../item';

export type Type = 'Buy' | 'Sell' | 'Barter' | 'Forex' | '???';

// Determine the type of trade from the items in the Buy/Sell Orders
export const getType = (trade: Trade, isMaker = true): Type => {
  const buyOrder = trade.buyOrder;
  const sellOrder = trade.sellOrder;
  if (!buyOrder || !sellOrder) return '???';

  const buyOnlyCurrency = buyOrder.items.every((item) => isItemCurrency(item));
  const sellOnlyCurrency = sellOrder.items.every((item) => isItemCurrency(item));
  const buyHasCurrency = buyOrder.items.some((item) => isItemCurrency(item));
  const sellHasCurrency = sellOrder.items.some((item) => isItemCurrency(item));

  if (buyOnlyCurrency && sellOnlyCurrency) return 'Forex';
  if (!buyHasCurrency && !sellHasCurrency) return 'Barter';
  if (!buyHasCurrency && sellOnlyCurrency) return isMaker ? 'Buy' : 'Sell';
  if (!sellHasCurrency && buyOnlyCurrency) return isMaker ? 'Sell' : 'Buy';
  return '???';
};

// gets the per unit item price if it's a simple Buy/Sell trade. 0 if unclear
export const getPerUnitPrice = (trade: Trade, type: Type): number => {
  const buyOrder = trade.buyOrder;
  const sellOrder = trade.sellOrder;
  if (!buyOrder || buyOrder.items.length !== 1) return 0;
  if (!sellOrder || sellOrder.items.length !== 1) return 0;

  if (type === 'Buy') return buyOrder.amounts[0] / sellOrder.amounts[0];
  else if (type === 'Sell') return sellOrder.amounts[0] / buyOrder.amounts[0];
  return 0;
};
