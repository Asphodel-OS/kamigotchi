import moment from 'moment';
import { Dispatch } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import { calcTradeTax, TradeType } from 'app/cache/trade';
import { Pairing, Text } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { MUSU_INDEX } from 'constants/items';
import { Account, Item } from 'network/shapes';
import { Trade } from 'network/shapes/Trade';
import { TRADE_ROOM_INDEX } from '../../constants';
import { ConfirmationData, OfferCard } from '../../library';

// represents the player's Buy/Sell Orders that are in PENDING state
// NOTE: only supports simple (single item) trades against musu atm
// TODO: add support for Trades you're the assigned Taker for (make executable)
export const PendingOffer = ({
  actions,
  controls,
  data,
  utils,
}: {
  actions: {
    cancelTrade: (trade: Trade) => void;
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
  const { cancelTrade, executeTrade } = actions;
  const { isConfirming, setIsConfirming, setConfirmData } = controls;
  const { account, trade, type } = data;
  const { getItemByIndex } = utils;

  /////////////////
  // HANDLERS

  const handleCancel = () => {
    const confirmAction = () => cancelTrade(trade);
    setConfirmData({
      title: 'Confirm Cancellation',
      content: getCancelConfirmation(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true);
  };

  const handleExecute = () => {
    const confirmAction = () => executeTrade(trade);
    setConfirmData({
      title: 'Confirm Execution',
      content: getExecuteConfirmation(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true);
  };

  /////////////////
  // INTERPRETATION

  // gets last trade state
  const getStateTooltip = () => {
    const timestamp =
      trade.timestamps &&
      `: ${moment(Number(trade.timestamps[trade.state]) * 1000).format('MM/DD HH:mm')}`;
    return [`${trade.state.toLowerCase()}${timestamp ?? ''}`];
  };

  // check whether the player can fill the specified order
  // skip check if the player is the maker
  // NOTE: this doesnt account for multiples of the same item in a single order
  const canFillOrder = (): boolean => {
    if (isMaker()) return true;
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
    if (isMaker()) return ['Cancel this trade?'];
    return [
      'You have been specified as the Taker for this trade',
      `Either by a loved one or a scammer (${trade.maker?.name ?? '???'})`,
      `Feel free to claim it.`,
    ];
  };

  // simple check for whether the player is the maker of the Trade Offer
  const isMaker = () => {
    return trade.maker?.entity === account.entity;
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
    const taxRate = tradeConfig?.tax.value ?? 0;

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
          <Text size={1.2}>{'You will receive'}</Text>
          <Text size={1.2}>{'('}</Text>
          {sellAmts.map((amt, i) => {
            const sellItem = sellItems[i];
            const tax = calcTradeTax(sellItem, amt, taxRate);
            const taxPercent = Math.floor(taxRate * 100).toFixed(2);
            const taxTooltip = [`${amt.toLocaleString()} ${sellItem.name}`];
            if (tax > 0) taxTooltip.push(`less ${taxPercent}% tax (${tax} ${sellItem.name})`);
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
      </Paragraph>
    );
  };

  // create the trade confirmation window content for Canceling a self-made order
  // get the Confirmation content for a cancellation of a self-made Trade Offer
  const getCancelConfirmation = () => {
    const musuItem = getItemByIndex(MUSU_INDEX);
    const tradeConfig = account.config?.trade;
    const createFee = tradeConfig?.fees.creation ?? 0;
    const deliveryFee = tradeConfig?.fees.delivery ?? 0;
    const sellItems = trade.sellOrder?.items ?? [];
    const sellAmts = trade.sellOrder?.amounts ?? [];

    return (
      <Paragraph>
        <Row>
          <Text size={1.2}>{'('}</Text>
          {sellAmts.map((amt, i) => {
            const amtStr = amt.toLocaleString();
            const sellItem = sellItems[i];
            return (
              <Pairing
                key={i}
                text={amtStr}
                icon={sellItem.image}
                tooltip={[`${amtStr} ${sellItem.name}`]}
              />
            );
          })}
          <Text size={1.2}>{`) `}</Text>
          <Text size={1.2}>{`will be returned to your Inventory.`}</Text>
        </Row>
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
        <Row>
          <Text size={0.9}>{`<Listing fee (`}</Text>
          <Pairing
            text={createFee.toLocaleString()}
            icon={musuItem.image}
            scale={0.9}
            tooltip={[`LoL RIP Bozo`, `mr. i-know-what-i-got`, `L pricing`, `\nRatio`]}
          />
          <Text size={0.9}>{`) will not be refunded>`}</Text>
        </Row>
      </Paragraph>
    );
  };

  /////////////////
  // RENDER

  return (
    <OfferCard
      button={{
        onClick: isMaker() ? handleCancel : handleExecute,
        text: isMaker() ? 'Cancel' : 'Execute',
        tooltip: getActionTooltip(),
        disabled: isConfirming || !canFillOrder(),
      }}
      data={{ account, trade, type }}
      utils={{ getStateTooltip }}
      reverse={trade.maker?.entity === account.entity}
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
