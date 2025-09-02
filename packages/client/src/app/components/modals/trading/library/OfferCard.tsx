import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { Overlay, Text, TextTooltip } from 'app/components/library';
import { Account, Item, NullAccount } from 'network/shapes';
import { Trade, TradeOrder } from 'network/shapes/Trade';
import { playClick } from 'utils/sounds';
import { getTypeColor } from '../helpers';

// represents the player's Buy/Sell Orders that are in EXECUTED state
// NOTE: only supports simple (single item) trades against musu atm
// TODO: add support for Trades you're the Taker for (disable action)
export const OfferCard = ({
  button,
  data: {
    account,
    trade,
    type,
  },
  utils,
  reverse,
}: {
  button: {
    onClick: (trade: Trade) => void;
    text: string;
    tooltip: string[];
    disabled?: boolean;
  };
  data: {
    account: Account;
    trade: Trade;
    type: TradeType;
  };
  utils?: {
    getStateTooltip: () => string[];
  };
  reverse?: boolean;
}) => {
  const [want, setWant] = useState<Item[]>([]);
  const [have, setHave] = useState<Item[]>([]);
  const [wantAmt, setWantAmt] = useState<number[]>([]);
  const [haveAmt, setHaveAmt] = useState<number[]>([]);
  const [leftAcc, setLeftAcc] = useState<Account>(NullAccount);
  const [rightAcc, setRightAcc] = useState<Account>(NullAccount);

  useEffect(() => {
    const buyOrder = trade.buyOrder;
    const sellOrder = trade.sellOrder;
    if (!buyOrder || !sellOrder) return;

    if (reverse) {
      setWant(sellOrder.items);
      setHave(buyOrder.items);
      setWantAmt(sellOrder.amounts);
      setHaveAmt(buyOrder.amounts);
      setLeftAcc(trade.maker ?? NullAccount);
      setRightAcc(trade.taker ?? NullAccount);
    } else {
      setWant(buyOrder.items);
      setHave(sellOrder.items);
      setWantAmt(buyOrder.amounts);
      setHaveAmt(sellOrder.amounts);
      setLeftAcc(trade.taker ?? NullAccount);
      setRightAcc(trade.maker ?? NullAccount);
    }
  }, [trade, reverse]);

  /////////////////
  // HANDLERS

  const handleClick = () => {
    button.onClick(trade);
    playClick();
  };

  /////////////////
  // INTERPRETATION

  // span is the max of the number of items specified on either side
  const getSpan = () => {
    const buySpan = trade.buyOrder?.items.length ?? 0;
    const sellSpan = trade.sellOrder?.items.length ?? 0;
    return Math.min(Math.max(buySpan, sellSpan), 2);
  };

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
  // RENDER

  return (
    <Container>
      <Side span={getSpan()} borderRight>
        <TextTooltip
          text={getOrderTooltip(reverse ? trade.sellOrder : trade.buyOrder)}
          alignText='left'
          direction='row'
        >
          {want.map((_, i) => (
            <ImagesWrapper key={i}>
              <Image src={want[i].image} />
              <Text size={0.6}>{wantAmt[i].toLocaleString()}</Text>
            </ImagesWrapper>
          ))}
        </TextTooltip>
      </Side>

      <TextTooltip title='status' text={utils?.getStateTooltip() || []} alignText='left'>
        <Controls>
          {trade.state === 'CANCELLED' && <CancelOverlay>Cancelled</CancelOverlay>}
          <TagContainer>
            <Overlay top={0.21} left={0.21}>
              <Text size={0.6}>{getNameDisplay(leftAcc)}</Text>
            </Overlay>
            <Overlay top={0.21} right={0.21}>
              <Text size={0.6}>{getNameDisplay(rightAcc)}</Text>
            </Overlay>
            <TypeTag color={getTypeColor(type)}>{type}</TypeTag>
          </TagContainer>
          <TextTooltip text={button.tooltip} fullWidth>
            <Button onClick={handleClick} disabled={button.disabled}>
              {button.text}
            </Button>
          </TextTooltip>
        </Controls>
      </TextTooltip>

      <Side span={getSpan()} borderLeft>
        <TextTooltip
          text={getOrderTooltip(reverse ? trade.buyOrder : trade.sellOrder)}
          alignText='left'
          direction='row'
        >
          {have.map((_, i) => (
            <ImagesWrapper key={i}>
              <Image src={have[i].image} />
              <Text size={0.6}>{haveAmt[i].toLocaleString()}</Text>
            </ImagesWrapper>
          ))}
        </TextTooltip>
      </Side>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: 0.15em solid black;
  border-radius: 1.2em;

  height: 6em;

  display: flex;
  flex-flow: row nowrap;

  overflow: hidden;
  user-select: none;
`;

const Side = styled.div<{ span: number; borderRight?: boolean; borderLeft?: boolean }>`
  position: relative;
  ${({ borderRight }) => borderRight && `border-right: 0.15em solid black;`}
  ${({ borderLeft }) => borderLeft && `border-left: 0.15em solid black;`}
  height: 100%;
  width: ${({ span }) => 4 * span + 1}em;
  padding: 0 0.6em;
  gap: 0.6em;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  overflow: scroll hidden;
`;

const ImagesWrapper = styled.div`
  padding-top: 0.6em;

  gap: 0.1em;
  margin: 0 0.3em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Image = styled.img`
  height: 3.3em;

  image-rendering: pixelated;
  user-drag: none;

  &:hover {
    filter: brightness(1.2);
  }
`;

const Controls = styled.div`
  width: 15em;
  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-between;
`;

const Button = styled.button`
  background-color: #eee;
  border: none;
  border-top: 0.15em solid black;
  width: 100%;

  font-size: 0.9em;
  line-height: 1.8em;
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

const TypeTag = styled.div<{ color: string; reverse?: boolean }>`
  width: 6em;
  padding: 0.2em;

  color: rgb(25, 39, 2);
  background-color: ${({ color }) => color};
  clip-path: ${({ reverse }) =>
    reverse
      ? `polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)`
      : `polygon(100% 100%, 10% 100%, 0% 50%, 10% 0%, 100% 0%, 90% 50%)`};

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 0.9em;
  line-height: 1.2em;
`;

const CancelOverlay = styled.div`
  position: absolute;
  top: 24%;
  left: 25%;
  width: 50%;
  height: 52%;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  color: rgb(128, 4, 4);
  border: 0.19em solid rgb(128, 4, 4);
  transform: rotate(-22deg);
  z-index: 1;
  clip-path: polygon(0.5% 1%, 80% 0%, 100% 25%, 100% 90%, 90% 100%, 0% 100%, 15% 100%, 0% 70%);
`;
