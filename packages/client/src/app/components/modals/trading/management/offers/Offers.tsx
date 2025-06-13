import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isItemCurrency } from 'app/cache/item';
import { EmptyText, Text } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { OrderType } from '../../types';
import { ExecutedOffer } from './ExecutedOffer';
import { OpenOffer } from './OpenOffer';

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
    account: Account;
    trades: Trade[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}

export const Offers = (props: Props) => {
  const { actions, controls, data, utils } = props;
  const { account, trades } = data;
  const { modals } = useVisibility();

  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [executedTrades, setExecutedTrades] = useState<Trade[]>([]);

  // keep the list of open and executed trades updated'
  useEffect(() => {
    if (!modals.trading) return;
    const openTrades = trades.filter((trade) => trade.state === 'OPEN');
    const executedTrades = trades.filter((trade) => trade.state === 'EXECUTED');
    setOpenTrades(openTrades);
    setExecutedTrades(executedTrades);
  }, [trades.length, modals.trading]);

  // determine what kind of trade this is to the player
  // TODO: check is simple atm. refine it over time
  const getTradeType = (trade: Trade): OrderType => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return '???';

    const buyOnlyMusu = buyOrder.items.every((item) => isItemCurrency(item));
    const sellOnlyMusu = sellOrder.items.every((item) => isItemCurrency(item));
    const buyHasMusu = buyOrder.items.some((item) => isItemCurrency(item));
    const sellHasMusu = sellOrder.items.some((item) => isItemCurrency(item));

    if (!buyHasMusu && sellOnlyMusu) return 'Buy';
    if (!sellHasMusu && buyOnlyMusu) return 'Sell';
    if (buyOnlyMusu && sellOnlyMusu) return 'Forex';
    if (!buyHasMusu && !sellHasMusu) return 'Barter';
    return '???';
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Title>Your Open Offers</Title>
      <Body>
        {openTrades.length > 0 && (
          <Text size={1.5} padding={{ top: 1.8, bottom: 0.6 }}>
            Pending Offers
          </Text>
        )}
        {openTrades.map((trade, i) => (
          <OpenOffer
            key={i}
            actions={actions}
            controls={controls}
            data={{ account, trade, type: getTradeType(trade) }}
            utils={utils}
          />
        ))}
        {executedTrades.length > 0 && (
          <Text size={1.5} padding={{ top: 2.4, bottom: 0.6 }}>
            Completed Offers
          </Text>
        )}
        {executedTrades.map((trade, i) => (
          <ExecutedOffer
            key={i}
            actions={actions}
            data={{ account, trade, type: getTradeType(trade) }}
          />
        ))}
      </Body>
      {trades.length === 0 && <EmptyText text={['You have no active trades']} />}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 60%;

  display: flex;
  flex-direction: column;
  align-items: center;

  overflow: hidden scroll;
  scrollbar-color: transparent transparent;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 2;
`;

const Body = styled.div`
  position: relative;
  height: max-content;
  width: 100%;

  padding: 0.9vw;
  gap: 0.9vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;
