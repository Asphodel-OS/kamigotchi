import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcAuctionCost, calcAuctionPrice } from 'app/cache/auction';
import { AuctionBuy, getKamidenClient } from 'clients/kamiden';
import { Auction } from 'network/shapes/Auction';

const kamidenClient = getKamidenClient();

type Data = {
  balance: number;
  time: number;
};

interface Props {
  name: string;
  auction: Auction;
  // history: number[];
  onClick?: () => void;
}

export const Chart = (props: Props) => {
  const { name, auction, onClick } = props;
  const [buys, setBuys] = useState<AuctionBuy[]>([]);
  const [ticks, setTicks] = useState<number[]>([]);
  const [balances, setBalances] = useState<number[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const startTs = auction.time.start;
  const endTs = Math.floor(Date.now() / 1000);

  useEffect(() => {
    retrieveBuys();
  }, [auction.supply.sold]);

  useEffect(() => {
    const ticks = genTimeSeries(startTs, endTs, 3600);
    const balances = genBalances(ticks);
    const prices = genPrices(ticks, balances);
    console.log(
      'ticks',
      ticks.map((ts, i) => {
        const timeStr = new Date(ts * 1000).toLocaleString();
        return [timeStr, balances[i], prices[i]];
      })
    );
    setTicks(ticks);
    setBalances(balances);
    setPrices(prices);
  }, [buys]);

  /////////////////
  // RETRIEVAL

  const retrieveBuys = async () => {
    const response = await kamidenClient.getAuctionBuys({});
    const buys = response.AuctionBuys;
    setBuys(buys.sort((a, b) => a.Timestamp - b.Timestamp));
  };

  /////////////////
  // INTERPRETATION

  const genTimeSeries = (from: number, to: number, step: number) => {
    const times: number[] = [];
    for (let i = from; i < to; i += step) {
      times.push(i);
    }
    return times;
  };

  const genBalances = (times: number[]) => {
    const balances = new Array(times.length).fill(0);
    let j = 0;
    let sum = 0;
    for (let i = 0; i < buys.length; i++) {
      const buy = buys[i];
      while (times[j] < buy.Timestamp) balances[j++] = sum;
      sum += buy.Amount;
    }
    while (j < times.length) balances[j++] = sum;
    return balances;
  };

  const genPrices = (times: number[], balances: number[]) => {
    const prices = new Array(times.length).fill(0);
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const balance = balances[i];
      prices[i] = calcAuctionPrice(auction, time, balance, 1);
    }
    return prices;
  };

  const getProgressString = () => {
    if (!auction.auctionItem?.index) return '(not yet live)';
    return `sold: ${auction.supply.sold} / ${auction.supply.total}`;
  };

  return (
    <Container onClick={onClick}>
      <Title>{name}</Title>
      <Text>
        current price: {calcAuctionCost(auction, 1)} {auction.paymentItem?.name}
      </Text>
      <Text>{getProgressString()}</Text>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  position: relative;
  width: 100%;

  padding: 0.6vw;
  margin: 0.6vw;
  gap: 0.6vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column wrap;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.8;
    cursor: pointer;
    text-decoration: underline;
  }
`;

const Title = styled.div`
  color: black;
  font-size: 1.8vw;
`;

const Text = styled.div`
  color: black;
  font-size: 1.2vw;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
  margin: 20px 0;
`;
