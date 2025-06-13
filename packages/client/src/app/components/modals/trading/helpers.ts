import { TradeType } from 'app/cache/trade';
import { TypeColors } from './constants';

export const getTypeColor = (type: TradeType): string => {
  if (type === 'Buy') return TypeColors.Buy;
  if (type === 'Sell') return TypeColors.Sell;
  if (type === 'Barter') return TypeColors.Barter;
  if (type === 'Forex') return TypeColors.Forex;
  return '';
};
