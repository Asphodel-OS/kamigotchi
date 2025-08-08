import moment from 'moment';
import { Dispatch } from 'react';
import styled from 'styled-components';

import { calcTradeTax, TradeType } from 'app/cache/trade';
import { Pairing, Text } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade';
import { TRADE_ROOM_INDEX } from '../../constants';
import { ConfirmationData, OfferCard } from '../../library';

interface Props {
  actions?: {
    completeTrade: (trade: Trade) => void;
  };
  controls?: {
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: {
    account: Account;
    isHistory?: boolean;
    trade: Trade;
    type: TradeType;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}

// represents the player's Buy/Sell Orders that are in EXECUTED state
// NOTE: only supports simple (single item) trades against musu atm
// TODO: add support for Trades you're the Taker for (disable action)
export const ExecutedOffer = (props: Props) => {
  const { actions, controls, data } = props;
  const { completeTrade } = actions ?? {};
  const { isConfirming, setIsConfirming, setConfirmData } = controls ?? {};
  const { account, isHistory, trade, type } = data;

  /////////////////
  // HANDLERS

  const handleComplete = () => {
    if (!completeTrade || !setConfirmData || !setIsConfirming) return;
    const confirmAction = () => completeTrade(trade);
    setConfirmData({
      title: 'Confirm Completion',
      subTitle: 'congrats on a deal made',
      content: getCompleteConfirmation(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true);
  };

  /////////////////
  // INTERPRETATION

  const getActionTooltip = () => {
    if (isMaker() && actions) return ['Complete this trade'];
    return [];
    /* return [
      'You Executed this Trade as the Taker',
      'No further action is required on your part',
      `It'll disappear when ${trade.maker?.name ?? '???'} completes it`,
    ];*/
  };

  const getStateTooltip = () => {
    const timestamp =
      trade.timestamps &&
      `: ${moment(Number(trade.timestamps[trade.state]) * 1000).format('MM/DD HH:mm')}`;
    return [`${trade.state.toLowerCase()}${timestamp ?? ''}`];
  };

  // simple check for whether the player is the maker of the Trade Offer
  const isMaker = () => {
    return trade.maker?.entity === account.entity;
  };

  /////////////////
  // DISPLAY

  // create the trade confirmation window content for Completing an Executed order
  // TODO: adjust Buy amounts for tax and display breakdown in tooltip
  const getCompleteConfirmation = () => {
    const buyItems = trade.buyOrder?.items ?? [];
    const buyAmts = trade.buyOrder?.amounts ?? [];
    const tradeConfig = account.config?.trade;
    const deliveryFee = tradeConfig?.fees.delivery ?? 0;
    const taxRate = tradeConfig?.tax.value ?? 0;
    const taxAmts = buyAmts.map((amt, i) => calcTradeTax(buyItems[i], amt, taxRate));

    return (
      <Paragraph>
        <Row>
          <Text size={1.2}>{'You will receive ('}</Text>
          {buyAmts.map((amt, i) => {
            const buyItem = buyItems[i];
            const tax = taxAmts[i];
            return (
              <Pairing
                key={i}
                text={(amt - tax).toLocaleString()}
                icon={buyItem.image}
                tooltip={[`${amt.toLocaleString()} (-${tax.toLocaleString()}) ${buyItem.name}`]}
              />
            );
          })}
          <Text size={1.2}>{`)`}</Text>
        </Row>
        {taxAmts.some((tax) => tax > 0) && (
          <Row>
            <Text size={0.9}>{`Trade Tax: (`}</Text>
            {taxAmts.map((tax, i) => {
              if (tax <= 0) return null;
              return (
                <Pairing
                  text={tax.toLocaleString()}
                  icon={buyItems[i].image}
                  scale={0.9}
                  tooltip={[
                    `There is no income tax in Kamigotchi World.`,
                    `Thank you for your patronage.`,
                  ]}
                />
              );
            })}
            <Text size={0.9}>{`)`}</Text>
          </Row>
        )}
        {account.roomIndex !== TRADE_ROOM_INDEX && (
          <Row>
            <Text size={0.9}>{`Delivery Fee: (`}</Text>
            <Pairing
              text={deliveryFee.toLocaleString()}
              icon={ItemImages.musu}
              scale={0.9}
              tooltip={[`Trading outside of designated rooms`, `incurs a flat delivery fee.`]}
            />
            <Text size={0.9}>{`)`}</Text>
          </Row>
        )}
      </Paragraph>
    );
  };

  /////////////////
  // RENDER

  return (
    <OfferCard
      button={{
        onClick: handleComplete,
        text: isMaker() && !isHistory ? 'Complete' : '.',
        tooltip: getActionTooltip(),
        disabled: isConfirming || !isMaker() || isHistory,
      }}
      data={{ account, trade, type }}
      reverse={trade.maker?.entity === account.entity}
      utils={{ getStateTooltip }}
    />
  );
};

const Paragraph = styled.div`
  color: #333;
  flex-grow: 1;
  padding: 1.8vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-evenly;
  align-items: center;
`;

const Row = styled.div`
  width: 100%;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;

const Cancelled = styled.div`
  position: absolute;
  top: 24%;
  left: 25%;
  width: 50%;
  height: 52%;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2vw;
  color: rgb(128, 4, 4);
  border: 0.19vw solid rgb(128, 4, 4);
  transform: rotate(-22deg);
  z-index: 2;
  clip-path: polygon(0.5% 1%, 80% 0%, 100% 25%, 100% 90%, 90% 100%, 0% 100%, 15% 100%, 0% 70%);
`;
