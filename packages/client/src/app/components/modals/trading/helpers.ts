import { StateColors, TypeColors } from './constants';
import { OrderState, OrderType } from './types';

export const getTypeColor = (type: OrderType): string => {
  if (type === 'Buy') return TypeColors.Buy;
  if (type === 'Sell') return TypeColors.Sell;
  if (type === 'Barter') return TypeColors.Barter;
  if (type === 'Forex') return TypeColors.Forex;
  return '';
};

export const getStateColor = (state: OrderState): string => {
  if (state === 'OPEN') return StateColors.OPEN;
  if (state === 'EXECUTED') return StateColors.EXECUTED;
  return '';
};
