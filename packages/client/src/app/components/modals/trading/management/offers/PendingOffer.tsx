import { Dispatch } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { Pairing, Text } from 'app/components/library';
import { MUSU_INDEX } from 'constants/items';
import { Account, Item } from 'network/shapes';
import { Trade, TradeOrder } from 'network/shapes/Trade';
import { ConfirmationData } from '../../Confirmation';
import { OfferCard } from './OfferCard';

interface Props {
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
}

// represents the player's Buy/Sell Orders that are in PENDING state
// NOTE: only supports simple (single item) trades against musu atm
// TODO: add support for Trades you're the assigned Taker for (make executable)
export const PendingOffer = (props: Props) => {
  const { actions, controls, data, utils } = props;
  const { cancelTrade } = actions;
  const { isConfirming, setIsConfirming, setConfirmData } = controls;
  const { account, trade, type } = data;
  const { getItemByIndex } = utils;

  /////////////////
  // HANDLERS

  const handleCancel = () => {
    const confirmAction = () => cancelTrade(trade);
    setConfirmData({
      title: 'Confirm Cancellation',
      content: getConfirmContent(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true);
  };

  /////////////////
  // INTERPRETATION

  // tooltip for list of order items/amts
  const getOrderTooltip = (order?: TradeOrder): string[] => {
    const tooltip = [];
    if (!order) return [];

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const amt = order.amounts[i];
      tooltip.push(`• ${amt.toLocaleString()} x ${item.name}`);
    }
    return tooltip;
  };

  /////////////////
  // DISPLAY

  // create the trade confirmation window content for Canceling an order
  // TODO: adjust Buy amounts for tax and display breakdown in tooltip
  const getConfirmContent = () => {
    const musuItem = getItemByIndex(MUSU_INDEX);
    const tradeConfig = account.config?.trade;
    const tradeFee = tradeConfig?.fee ?? 0;

    return (
      <Paragraph>
        {/* <Row>
          <Text size={1.2}>{'('}</Text>
          <Pairing
            text={sellAmt.toLocaleString()}
            icon={sellItem.image}
            tooltip={getOrderTooltip(trade.sellOrder)}
          />
          <Text size={1.2}>{`) will be returned to your Inventory.`}</Text>
        </Row> */}
        <Row>
          <Text size={0.9}>{`Listing fee (`}</Text>
          <Pairing
            text={tradeFee.toLocaleString()}
            icon={musuItem.image}
            scale={0.9}
            tooltip={[`LoL RIP Bozo`, `mr. i-know-what-i-got`, `L pricing`, `\nRatio`]}
          />
          <Text size={0.9}>{`) will not be refunded.`}</Text>
        </Row>
      </Paragraph>
    );
  };

  /////////////////
  // RENDER

  return (
    <OfferCard
      button={{
        onClick: handleCancel,
        text: 'Cancel',
        tooltip: ['Cancel Order?'],
        disabled: isConfirming,
      }}
      data={{ account, trade, type }}
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
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;
