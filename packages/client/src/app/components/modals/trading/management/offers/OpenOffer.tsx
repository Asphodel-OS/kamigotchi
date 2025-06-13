import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Overlay, Pairing, Text, TextTooltip } from 'app/components/library';
import { MUSU_INDEX } from 'constants/items';
import { Account, Item, NullItem } from 'network/shapes';
import { Trade, TradeOrder } from 'network/shapes/Trade';
import { playClick } from 'utils/sounds';
import { ConfirmationData } from '../../Confirmation';
import { getTypeColor } from '../../helpers';
import { OrderType } from '../../types';

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
    type: OrderType;
  };
  utils: {
    getItemByIndex: (index: number) => Item;
  };
}

// represents the player's Buy/Sell Orders that are in OPEN state
// NOTE: only supports simple (single item) trades against musu atm
// TODO: add support for Trades you're the assigned Taker for (make executable)
export const OpenOffer = (props: Props) => {
  const { actions, controls, data, utils } = props;
  const { cancelTrade } = actions;
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

  const handleCancel = () => {
    const confirmAction = () => cancelTrade(trade);
    setConfirmData({
      title: 'Confirm Cancellation',
      content: getConfirmContent(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true);
    playClick();
  };

  /////////////////
  // INTERPRETATION

  // determine the name to display for an Account
  const getNameDisplay = (trader?: Account): string => {
    if (!trader || !trader.name) return '???';
    if (trader.entity === account.entity) return 'You';
    return trader.name;
  };

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
        <Row>
          <Text size={1.2}>{'('}</Text>
          <Pairing
            text={sellAmt.toLocaleString()}
            icon={sellItem.image}
            tooltip={getOrderTooltip(trade.sellOrder)}
          />
          <Text size={1.2}>{`) will be returned to your Inventory.`}</Text>
        </Row>
        <Row>
          <Text size={0.9}>{`Listing fee (`}</Text>
          <Pairing
            text={tradeFee.toLocaleString()}
            icon={musuItem.image}
            scale={0.9}
            tooltip={[`Lol RIP Bozo`, `mr. i-know-what-i-got`, `L pricing`, `Ratio`]}
          />
          <Text size={0.9}>{`) will not be refunded.`}</Text>
        </Row>
      </Paragraph>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <ImageContainer borderRight>
        <TextTooltip
          title='you are offering..'
          text={getOrderTooltip(trade.sellOrder)}
          alignText='left'
        >
          <Image src={sellItem.image} />
        </TextTooltip>
        <Overlay bottom={0.15} fullWidth>
          <Text size={0.6}>{sellAmt.toLocaleString()}</Text>
        </Overlay>
      </ImageContainer>
      <Controls>
        <TagContainer>
          <Overlay top={0.21} left={0.21}>
            <Text size={0.6}>{getNameDisplay(trade.maker)}</Text>
          </Overlay>
          <Overlay top={0.21} right={0.21}>
            <Text size={0.6}>{getNameDisplay(trade.taker)}</Text>
          </Overlay>
          <TypeTag color={getTypeColor(type)}>{type}</TypeTag>
        </TagContainer>
        <Button onClick={handleCancel} disabled={isConfirming}>
          Cancel
        </Button>
      </Controls>
      <ImageContainer borderLeft>
        <TextTooltip
          title='you may receive..'
          text={getOrderTooltip(trade.buyOrder)}
          alignText='left'
        >
          <Image src={buyItem.image} />
        </TextTooltip>
        <Overlay bottom={0.15} fullWidth>
          <Text size={0.6}>{buyAmt.toLocaleString()}</Text>
        </Overlay>
      </ImageContainer>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: 0.15vw solid black;
  border-radius: 1.2vw;

  width: 24vw;
  height: 6vw;

  user-select: none;

  display: flex;
  flex-flow: row nowrap;
`;

const ImageContainer = styled.div<{ borderRight?: boolean; borderLeft?: boolean }>`
  position: relative;
  ${({ borderRight }) => borderRight && `border-right: 0.15vw solid black;`}
  ${({ borderLeft }) => borderLeft && `border-left: 0.15vw solid black;`}
  height: 100%;
  padding: 0.6vw;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const Image = styled.img`
  height: 3.3vw;

  image-rendering: pixelated;
  user-drag: none;

  &:hover {
    filter: brightness(1.2);
  }
`;

const Controls = styled.div`
  display: flex;
  flex-grow: 1;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Button = styled.button`
  background-color: #eee;
  border: none;
  border-top: 0.15vw solid black;
  width: 100%;

  font-size: 0.9vw;
  line-height: 1.8vw;
  cursor: pointer;

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
  &:disabled {
    background-color: #bbb;
    cursor: default;
  }
`;

const TagContainer = styled.div`
  position: relative;
  width: 100%;
  flex-grow: 1;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
`;

const TypeTag = styled.div<{ color: string }>`
  width: 5vw;
  padding: 0.2vw;

  color: rgb(25, 39, 2);
  background-color: ${({ color }) => color};
  clip-path: polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 0.9vw;
`;

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
