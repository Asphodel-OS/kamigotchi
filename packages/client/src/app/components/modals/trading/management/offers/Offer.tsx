import { Dispatch } from 'react';

import { isItemCurrency } from 'app/cache/item';
import { Trade } from 'network/shapes/Trade';
import { OrderType } from '../../types';
import { StandardOfferCard } from '../StandardOfferCard';

interface Props {
  actions: {
    completeTrade: (trade: Trade) => void;
    cancelTrade: (trade: Trade) => void;
  };
  controls: {
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmTitle: Dispatch<string>;
    setConfirmContent: Dispatch<React.ReactNode>;
    setConfirmAction: Dispatch<(params: any) => any>;
  };
  data: {
    trade: Trade;
  };
}

// determines the type of trade offer this is and renders the appropriate component
export const Offer = (props: Props) => {
  const { actions, data } = props;
  const { trade } = data;

  // determine what kind of trade this is to the player
  // TODO: check is simple atm. refine it over time
  const getTradeType = (trade: Trade): OrderType => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return '???';

    const buyHasMusu = buyOrder!.items.some((item) => isItemCurrency(item));
    const sellHasMusu = sellOrder!.items.some((item) => isItemCurrency(item));

    if (!buyHasMusu && sellHasMusu) return 'Buy';
    if (buyHasMusu && !sellHasMusu) return 'Sell';
    if (buyHasMusu && sellHasMusu) return 'Forex';
    if (!buyHasMusu && !sellHasMusu) return 'Barter';
    return '???';
  };

  return <StandardOfferCard actions={actions} data={{ trade, type: getTradeType(trade) }} />;
};
