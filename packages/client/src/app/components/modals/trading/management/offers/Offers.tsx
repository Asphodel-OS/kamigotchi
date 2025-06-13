import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isItemCurrency } from 'app/cache/item';
import { EmptyText, Text } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade/types';
import { ConfirmationData } from '../../Confirmation';
import { OrderType, TabType } from '../../types';
import { ExecutedOffer } from './ExecutedOffer';
import { OpenOffer } from './OpenOffer';

interface Props {
  actions: {
    completeTrade: (trade: Trade) => void;
    cancelTrade: (trade: Trade) => void;
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
    tab: TabType;
  };
  data: {
    account: Account;
    trades: Trade[];
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}

// displays the player's open and executed trade offers
// TODO: display the 'Executable' offers (where the player is the Taker) as well
export const Offers = (props: Props) => {
  const { actions, controls, data, utils } = props;
  const { tab } = controls;
  const { account, trades } = data;
  const { modals } = useVisibility();

  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [executedTrades, setExecutedTrades] = useState<Trade[]>([]);

  // keep the list of open and executed trades updated'
  useEffect(() => {
    if (!modals.trading || tab !== `Management`) return;
    const openTrades = trades.filter((trade) => trade.state === 'OPEN');
    const executedTrades = trades.filter((trade) => trade.state === 'EXECUTED');
    setOpenTrades(openTrades);
    setExecutedTrades(executedTrades);
  }, [trades, modals.trading, tab]);

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
            Executed Offers
          </Text>
        )}
        {executedTrades.map((trade, i) => (
          <ExecutedOffer
            key={i}
            actions={actions}
            controls={controls}
            data={{ account, trade, type: getTradeType(trade) }}
            utils={utils}
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
