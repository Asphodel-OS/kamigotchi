import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, TextTooltip } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { Trade, TradeOrder } from 'network/shapes/Trade/types';

interface Props {
  actions: {
    cancelTrade: (tradeId: BigNumberish) => void;
  };
  controls: {
    search: string;
    ascending: boolean;
  };
  data: { trades: Trade[] };
}

export const Offers = (props: Props) => {
  const { actions, controls, data } = props;
  const { cancelTrade } = actions;
  const { search, ascending } = controls;
  const { trades } = data;

  const [processedData, setProcessedData] = useState<Trade[]>([]);

  // sort trades accordingly as new ones come in
  useEffect(() => {
    if (!trades) return;
    trades.sort(function (a, b) {
      let aa = a.sellOrder?.items[0].name;
      let bb = b.sellOrder?.items[0].name;
      let compareA = Number(a.sellOrder?.amounts[0]);
      let compareB = Number(b.sellOrder?.amounts[0]);
      if (!aa?.includes('MUSU')) {
        aa = a.buyOrder?.items[0].name;
        compareA = Number(a.buyOrder?.amounts[0]);
      }
      if (!bb?.includes('MUSU')) {
        bb = b.buyOrder?.items[0].name;
        compareB = Number(b.buyOrder?.amounts[0]);
      }

      return ascending ? compareA - compareB : compareB - compareA;
    });
    setProcessedData(trades);
  }, [ascending, trades]);

  const searchCheck = (tradeOrder: TradeOrder) => {
    return tradeOrder?.items[0].name.toLowerCase().includes(search.toLowerCase());
  };

  const ActiveOfferCards = () => {
    return processedData.map((trade, i) => {
      const sellOrderHasMusu = trade.sellOrder?.items[0].name === 'MUSU';
      const itemMusu = {
        Item: sellOrderHasMusu ? trade.buyOrder : trade.sellOrder,
        Musu: sellOrderHasMusu ? trade.sellOrder : trade.buyOrder,
        Order: sellOrderHasMusu ? 'Buy' : 'Sell',
      };
      return (
        <Card key={i}>
          <OuterSide>
            <TextTooltip text={[Number(itemMusu.Item?.amounts[0]).toString()]}>
              <Icon src={itemMusu.Item?.items[0].image} />
              <TextCap cap={5} style={{ marginLeft: `1.5vw` }}>
                {Number(itemMusu.Item?.amounts[0]).toString()}
              </TextCap>
            </TextTooltip>
          </OuterSide>
          <RightSide>
            <TopRow>
              <TextTooltip text={[itemMusu.Item?.items[0].name!]}>
                <TextCap fontSize={0.8} cap={15} style={{ marginRight: `1vw` }}>
                  {itemMusu.Item?.items[0].name!}
                </TextCap>
              </TextTooltip>
            </TopRow>
            <BottomRow>
              <InnerSide>
                <TextCap>Trade: {itemMusu.Order}</TextCap>
                <TextTooltip text={[Number(itemMusu.Musu?.amounts[0]).toString()]}>
                  <div
                    style={{
                      display: `flex`,
                      alignItems: `center`,
                      flexDirection: `row`,
                    }}
                  >
                    <Icon
                      style={{ width: `1.5vw`, margin: '0.3vw 0.3vw 0 0 ' }}
                      src={ItemImages.musu}
                    />
                    <TextCap cap={19}>{Number(itemMusu.Musu?.amounts[0])}</TextCap>
                  </div>
                </TextTooltip>
              </InnerSide>
              <ActionButton text='Cancel' onClick={() => cancelTrade(trade.id)} />
            </BottomRow>
          </RightSide>
        </Card>
      );
    });
  };

  const hasTrades = ActiveOfferCards().some((item) => item !== null);

  return (
    <Container>
      <Title>Your Active Offers </Title>
      <Cards>
        {hasTrades ? ActiveOfferCards() : <EmptyText>You have no active trades</EmptyText>}
      </Cards>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 66%;

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
  border-radius: 0.6vw;
  width: 100%;
  padding: 1.2vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 2;
`;

const Cards = styled.div`
  position: relative;
  height: max-content;
  width: 100%;
  background-color: rgb(255, 255, 255);

  margin-top: 0.8vw;
  display: flex;
  flex-direction: column;
  align-items: center;

  flex-direction: row;

  flex-wrap: wrap;
`;

const Card = styled.div`
  position: relative;
  border: 0.15vw solid black;
  border-radius: 0.45vw;

  margin-bottom: 0.3vw;
  height: 7.5vw;
  width: 100%;

  display: flex;
  flex-flow: row;
  align-items: flex-start;
`;

const OuterSide = styled.div`
  display: flex;
  flex-flow: row;
  justify-content: center;
  border-right: 0.2vw solid black;
  padding: 0.5vw 0.5vw 1vw 1vw;
  height: 100%;
  flex-wrap: wrap;
  flex-direction: column;
  align-content: center;
  align-items: center;
  width: fit-content;
`;

const Icon = styled.img`
  width: 2.8vw;
  image-rendering: pixelated;
`;

const TextCap = styled.div<{ cap?: number; fontSize?: number }>`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  ${({ cap }) => (cap ? `max-width: ${cap}ch;` : `max-width: 19ch;`)}
  ${({ fontSize }) => (fontSize ? `font-size: ${fontSize}vw;` : `font-size: 0.6vw;`)}
`;

const TopRow = styled.div`
  height: 20%;
  font-size: 0.77vw;
  padding: 0.5vw;
  border-bottom: 0.15vw solid black;
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const BottomRow = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 75%;
  padding: 0 0.4vw 0 0.4vw;
  justify-content: space-around;
`;
const InnerSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
`;

const RightSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  height: 100%;
  -webkit-box-pack: justify;
  justify-content: space-around;
`;
const EmptyText = styled.div`
  text-align: center;
  padding: 20px;
  color: rgb(102, 102, 102);
  font-style: italic;
  font-size: 1.2vw;
`;
