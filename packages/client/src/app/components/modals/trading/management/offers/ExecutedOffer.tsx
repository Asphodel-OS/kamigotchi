import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { isItemCurrency } from 'app/cache/item';
import { TradeType } from 'app/cache/trade';
import { Pairing, Text } from 'app/components/library';
import { MUSU_INDEX } from 'constants/items';
import { Account, Item, NullItem } from 'network/shapes';
import { Trade, TradeOrder } from 'network/shapes/Trade';
import { ConfirmationData } from '../../Confirmation';
import { OfferCard } from './OfferCard';

interface Props {
  actions: {
    completeTrade: (trade: Trade) => void;
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

// represents the player's Buy/Sell Orders that are in EXECUTED state
// NOTE: only supports simple (single item) trades against musu atm
// TODO: add support for Trades you're the Taker for (disable action)
export const ExecutedOffer = (props: Props) => {
  const { actions, controls, data, utils } = props;
  const { completeTrade } = actions;
  const { isConfirming, setIsConfirming, setConfirmData } = controls;
  const { account, trade, type } = data;
  const { getItemByIndex } = utils;

  const [buyItem, setBuyItem] = useState<Item>(NullItem);
  const [buyAmt, setBuyAmt] = useState<number>(1);
  const [sellItem, setSellItem] = useState<Item>(NullItem);
  const [sellAmt, setSellAmt] = useState<number>(1);

  // set either side of a standard order based on the type
  useEffect(() => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return;

    setBuyItem(buyOrder.items[0]);
    setBuyAmt(buyOrder.amounts[0]);
    setSellItem(sellOrder.items[0]);
    setSellAmt(sellOrder.amounts[0]);
  }, [trade, type]);

  /////////////////
  // HANDLERS

  const handleComplete = () => {
    const confirmAction = () => completeTrade(trade);
    setConfirmData({
      title: 'Confirm Completion',
      subTitle: 'congrats on a deal made',
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

  const getActionTooltip = () => {
    if (isMaker()) return ['Complete this trade'];
    return [
      'You Executed this Trade as the Taker',
      'No further action is required on your part',
      `It'll disappear when ${trade.maker?.name ?? '???'} completes it`,
    ];
  };

  const isMaker = () => {
    return trade.maker?.entity === account.entity;
  };

  /////////////////
  // DISPLAY

  // create the trade confirmation window content for Completing an Executed order
  // TODO: adjust Buy amounts for tax and display breakdown in tooltip
  const getConfirmContent = () => {
    const musuItem = getItemByIndex(MUSU_INDEX);

    // determine taxxed amount
    let tax = 0;
    if (isItemCurrency(buyItem)) {
      const tradeConfig = account.config?.trade;
      const taxRate = tradeConfig?.tax.value ?? 0;
      tax = Math.floor(buyAmt * taxRate);
    }

    return (
      <Paragraph>
        <Row>
          <Text size={1.2}>{'You will receive ('}</Text>
          <Pairing
            text={(buyAmt - tax).toLocaleString()}
            icon={buyItem.image}
            tooltip={getOrderTooltip(trade.buyOrder)}
          />
          <Text size={1.2}>{`).`}</Text>
        </Row>
        {tax > 0 && (
          <Row>
            <Text size={0.9}>{`Trade Tax: (`}</Text>
            <Pairing
              text={tax.toLocaleString()}
              icon={musuItem.image}
              scale={0.9}
              tooltip={[
                `There is no income tax in Kamigotchi World.`,
                `Thank you for your patronage.`,
              ]}
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
        text: isMaker() ? 'Complete' : '.',
        tooltip: getActionTooltip(),
        disabled: isConfirming || !isMaker(),
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
