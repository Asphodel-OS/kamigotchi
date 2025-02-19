import ChartJS from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { calcAuctionCost, calcAuctionPrice } from 'app/cache/auction';
import { Overlay } from 'app/components/library';
import { AuctionBuy, getKamidenClient } from 'clients/kamiden';
import { Auction } from 'network/shapes/Auction';
import { ChartOptions } from './chartOptions';

const kamidenClient = getKamidenClient();

type Data = {
  balance: number;
  price: number;
  time: number;
};

interface Props {
  name: string;
  auction: Auction;
  onClick?: () => void;
}

export const Chart = (props: Props) => {
  const { name, auction, onClick } = props;
  const chartRef = useRef<ChartJS>();

  const [buys, setBuys] = useState<AuctionBuy[]>([]);
  const [data, setData] = useState<Data[]>([]);

  // TODO: time range controls and smart determination of time bounds
  const endTs = Math.floor(Date.now() / 1000);
  const startTs = auction.time.start != 0 ? auction.time.start : endTs;

  // retrieve this auction's buy history
  useEffect(() => {
    const retrieveBuys = async () => {
      const response = await kamidenClient.getAuctionBuys({});
      const buys = response.AuctionBuys;
      setBuys(buys.sort((a, b) => a.Timestamp - b.Timestamp));
    };
    retrieveBuys();
  }, [auction.supply.sold]);

  // generate the price history data based on buy history and auction settings
  useEffect(() => {
    const ticks = genTimeSeries(startTs, endTs, 3600 * 4);
    const balances = genBalances(ticks);
    const prices = genPrices(ticks, balances);
    const data = ticks.map((ts, i) => {
      return { time: ts, balance: balances[i], price: prices[i] };
    });
    setData(data);
  }, [buys, auction]);

  // format and generate the chart from the data
  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy(); // destroy existing chart if it exists
    const canvas = document.getElementById('priceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // define data
    const chartData = {
      labels: data.map((d) => new Date(d.time * 1000).toLocaleString()),
      datasets: [
        {
          label: 'Price',
          data: data.map((d) => d.price),
          borderColor: 'rgb(75, 192, 1)',
          tension: 0.1,
        },
      ],
    };

    // create new chart
    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: chartData,
      options: ChartOptions,
    });

    // cleanup on unmount
    return () => {
      const currentChart = chartRef.current;
      if (currentChart) currentChart.destroy();
    };
  }, [data]);

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
    return `${auction.supply.sold} / ${auction.supply.total}`;
  };

  return (
    <Container onClick={onClick}>
      <Title>{name}</Title>
      <Overlay right={1} top={3}>
        <Text>
          {calcAuctionCost(auction, 1)} {auction.paymentItem?.name}
        </Text>
      </Overlay>
      <Overlay right={1} top={4.5}>
        <Text>{getProgressString()}</Text>
      </Overlay>
      <ChartContainer>
        <canvas id='priceChart'></canvas>
      </ChartContainer>
    </Container>
  );
};

const Container = styled.div`
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

  overflow: scroll;
`;

const Title = styled.div`
  color: black;
  font-size: 1.8vw;
  margin: 1.2vw;
`;

const Text = styled.div`
  color: black;
  font-size: 0.9vw;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 15vw;
`;
