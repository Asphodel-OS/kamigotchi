import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { getTradeType, Trade } from 'app/cache/trade';
import { EmptyText, Text } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Account, Item } from 'network/shapes';
import { ConfirmationData } from '../../library/Confirmation';
import { TabType } from '../../types';
import { ExecutedOffer } from './ExecutedOffer';
import { PendingOffer } from './PendingOffer';

// displays the player's open and executed trade offers
// TODO: display the 'Executable' offers (where the player is the Taker) as well
export const Offers = ({
  actions,
  controls,
  data,
  utils,
}: {
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
}) => {
  const { tab } = controls;
  const { account, trades } = data;
  const { modals } = useVisibility();

  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [executedTrades, setExecutedTrades] = useState<Trade[]>([]);

  // keep the list of open and executed trades updated'
  useEffect(() => {
    if (!modals.trading || tab !== `Management`) return;
    const openTrades = trades.filter((trade) => trade.state === 'PENDING');
    const executedTrades = trades.filter(
      (trade) => trade.state === 'EXECUTED' && trade.maker?.entity === account.entity
    );
    setOpenTrades(openTrades);
    setExecutedTrades(executedTrades);
  }, [trades, modals.trading, tab]);

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
          <PendingOffer
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
  background-color: rgb(221, 221, 221);
  opacity: 0.9;

  width: 100%;
  top: 0;
  z-index: 1;
  padding: 1.8em;

  color: black;
  font-size: 1.2em;
  text-align: left;
`;

const Body = styled.div`
  position: relative;
  height: max-content;
  width: 100%;

  padding: 0.9em;
  gap: 0.9em;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;
