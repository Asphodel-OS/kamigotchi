import { TypeColors } from './constants';
import { OrderType } from './types';

export const getTypeColor = (type: OrderType): string => {
  if (type === 'Buy') return TypeColors.Buy;
  if (type === 'Sell') return TypeColors.Sell;
  if (type === 'Barter') return TypeColors.Barter;
  if (type === 'Forex') return TypeColors.Forex;
  return '';
};
