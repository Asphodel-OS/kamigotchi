import { Dispatch } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import { calcTradeTax, TradeType } from 'app/cache/trade';
import { Pairing, Text } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade';
import { playClick } from 'utils/sounds';
import { TRADE_ROOM_INDEX } from '../../constants';
import { ConfirmationData, OfferCard } from '../../library';

// represents other Buy/Sell Orders that are in PENDING state
// NOTE: only supports simple (single item) trades against musu atm
export const PendingOffer = ({
  actions,
  controls,
  data,
  utils,
}: {
  actions: {
    executeTrade: (trade: Trade) => void;
  };
  controls: {
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: {
    account: Account;
    trade: Trade;
    type: TradeType;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}) => {
  const { executeTrade } = actions;
  const { isConfirming, setIsConfirming, setConfirmData } = controls;
  const { account, trade, type } = data;

  /////////////////
  // HANDLERS

  const handleExecute = () => {
    const confirmAction = () => executeTrade(trade);
    setConfirmData({
      title: 'Confirm Execution',
      content: getExecuteConfirmation(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true);
    playClick();
  };

  /////////////////
  // INTERPRETATION

  // check whether the player can fill the specified order
  // NOTE: this doesnt account for multiples of the same item in a single order
  const canFillOrder = (): boolean => {
    const order = trade.buyOrder;
    if (!order) return false;

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const amt = order.amounts[i];

      const balance = getInventoryBalance(account.inventories ?? [], item.index);
      if (balance < amt) return false;
    }
    return true;
  };

  // get the tooltip of the action button
  const getActionTooltip = () => {
    if (!canFillOrder()) {
      return ['Too poore', 'get more items to fulfill this Trade Offer'];
    }
    return ['Execute this trade'];
  };

  /////////////////
  // DISPLAY

  // create the trade confirmation window content for Executing an order
  const getExecuteConfirmation = () => {
    const buyItems = trade.buyOrder?.items ?? [];
    const buyAmts = trade.buyOrder?.amounts ?? [];
    const sellItems = trade.sellOrder?.items ?? [];
    const sellAmts = trade.sellOrder?.amounts ?? [];
    const tradeConfig = account.config?.trade;
    const deliveryFee = tradeConfig?.fees.delivery ?? 0;
    const taxRate = tradeConfig?.tax.value ?? 0;
    const taxAmts = sellAmts.map((amt, i) => calcTradeTax(sellItems[i], amt, taxRate));

    return (
      <Paragraph>
        <Row>
          <Text size={1.2}>{'('}</Text>
          {buyAmts.map((amt, i) => {
            const amtStr = amt.toLocaleString();
            const buyItem = buyItems[i];
            return (
              <Pairing
                key={i}
                text={amtStr}
                icon={buyItem.image}
                tooltip={[`${amtStr} ${buyItem.name}`]}
              />
            );
          })}
          <Text size={1.2}>{`) `}</Text>
          <Text size={1.2}>{`will be transferred to the Trade.`}</Text>
        </Row>
        <Row>
          <Text size={1.2}>{'You will receive ('}</Text>
          {sellAmts.map((amt, i) => {
            const sellItem = sellItems[i];
            const tax = taxAmts[i];
            return (
              <Pairing
                key={i}
                text={(amt - tax).toLocaleString()}
                icon={sellItem.image}
                tooltip={[`${amt.toLocaleString()} (-${tax.toLocaleString()}) ${sellItem.name}`]}
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
                  icon={sellItems[i].image}
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
        onClick: handleExecute,
        text: 'Execute',
        tooltip: getActionTooltip(),
        disabled: isConfirming || !canFillOrder(),
      }}
      data={{ account, trade, type }}
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
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;
