import ChartJS from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { calcAuctionCost, calcAuctionPrice } from 'app/cache/auction';
import { ActionListButton, Overlay } from 'app/components/library';
import { AuctionBuy, getKamidenClient } from 'clients/kamiden';
import { Auction } from 'network/shapes/Auction';
import { ChartOptions, CrosshairPlugin } from './chartOptions';
import { DTs } from './constants';

const kamidenClient = getKamidenClient();

type Data = {
  time: number;
  sales: number;
  balance: number;
  price: number;
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
  const [dt, setDt] = useState<keyof typeof DTs>('H4');

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
    const ticks = genTimeSeries(startTs, endTs, DTs[dt]);
    const [balances, sales] = genBalances(ticks);
    const prices = genPrices(ticks, balances);
    const data = ticks.map((ts, i) => {
      return { time: ts, balance: balances[i], price: prices[i], sales: sales[i] };
    });
    setData(data);
  }, [buys, auction, dt]);

  // format and generate the chart from the data
  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy(); // destroy existing chart if it exists
    const canvas = document.getElementById(`chart-${name}`) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // define data
    const chartData = {
      labels: data.map((d) => new Date(d.time * 1000).toLocaleString()),
      datasets: [
        {
          type: 'line',
          label: 'Price',
          data: data.map((d) => d.price),
          borderColor: 'rgb(75, 192, 1)',
          tension: 0.1,
          yAxisID: 'y1',
        },
        {
          type: 'bar',
          label: 'Sales',
          data: data.map((d) => d.sales),
          backgroundColor: 'rgb(1, 120, 192)',
          yAxisID: 'y2',
        },
      ],
    };

    // create new chart
    chartRef.current = new ChartJS(ctx, {
      data: chartData,
      options: ChartOptions,
      plugins: [CrosshairPlugin],
    });

    // cleanup on unmount
    return () => {
      const currentChart = chartRef.current;
      if (currentChart) currentChart.destroy();
    };
  }, [data]);

  /////////////////
  // CALCULATION

  // generate the list of time steps based on the auction time range
  const genTimeSeries = (from: number, to: number, step: number) => {
    const times: number[] = [];
    for (let i = from; i < to; i += step) {
      times.push(i);
    }
    return times;
  };

  // generate the lists of current and aggregate sales based on buy history
  const genBalances = (times: number[]) => {
    const balances = new Array(times.length).fill(0);
    const sales = new Array(times.length).fill(0);

    let j = 0;
    let sum = 0;
    for (let i = 0; i < buys.length; i++) {
      const buy = buys[i];
      while (times[j] < buy.Timestamp) balances[j++] = sum;
      sum += buy.Amount;
      sales[j] += buy.Amount;
    }
    while (j < times.length) balances[j++] = sum;
    return [balances, sales];
  };

  const genPrices = (times: number[], balances: number[]) => {
    const prices = new Array(times.length).fill(0);

    let time;
    for (let i = 0; i < times.length; i++) {
      time = times[i];
      if (time < auction.time.start) time = auction.time.start;
      const balance = balances[i];
      prices[i] = calcAuctionPrice(auction, time, balance, 1);
    }
    return prices;
  };

  /////////////////
  // INTERPRETATION

  const getProgressString = () => {
    if (!auction.auctionItem?.index) return '(not yet live)';
    return `${auction.supply.sold} / ${auction.supply.total}`;
  };

  const getStartDTString = () => {
    if (!auction.time.start) return '(not yet live)';
    const date = new Date(auction.time.start * 1000);
    return date.toLocaleDateString();
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Title onClick={onClick}>{name}</Title>
      <Overlay left={0.9} top={3}>
        <Text size={0.75}>{`Started: ${getStartDTString()}`}</Text>
      </Overlay>
      <Overlay right={3} top={2.1}>
        <ActionListButton
          id='dt'
          text={dt}
          options={[
            { text: 'H', onClick: () => setDt('H') },
            { text: 'H4', onClick: () => setDt('H4') },
            { text: 'D', onClick: () => setDt('D') },
            { text: 'W', onClick: () => setDt('W') },
          ]}
        />
      </Overlay>
      <Overlay right={3.9} top={4.5} passthrough>
        <Text size={0.9}>
          {calcAuctionCost(auction, 1)} {auction.paymentItem?.name}
        </Text>
      </Overlay>
      <Overlay right={3.9} top={6} passthrough>
        <Text size={0.9}>{getProgressString()}</Text>
      </Overlay>
      <ChartContainer>
        <canvas id={`chart-${name}`}></canvas>
      </ChartContainer>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;

  margin-top: 0.6vw;
  gap: 0.6vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column wrap;
  align-items: center;
  justify-content: center;

  overflow: scroll;
`;

const Title = styled.div`
  color: black;
  font-size: 1.8vw;
  margin: 0.6vw;

  &:hover {
    opacity: 0.8;
    cursor: pointer;
    text-decoration: underline;
  }
`;

const Text = styled.div<{ size: number }>`
  color: black;
  font-size: ${({ size }) => size}vw;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 15vw;
`;
