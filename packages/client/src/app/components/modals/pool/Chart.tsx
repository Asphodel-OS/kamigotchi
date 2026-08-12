import ChartJS from 'chart.js/auto';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Text } from 'app/components/library';
import { getKamidenClient } from 'clients/kamiden';
import { playClick } from 'utils/sounds';

const KamidenClient = getKamidenClient();

const DAY = 3600 * 24;

const Y_TICKS = 5;
const X_LABEL_DIVISOR = 5;

const GREEN = '#2F8F46';
const GRID = '#e8e8e8';
const CROSSHAIR = '#bbb';
const TICK = '#999';

const RANGES = {
  '7d': DAY * 7,
  '30d': DAY * 30,
  Max: null,
} as const;

type Range = keyof typeof RANGES;
type Status = 'offline' | 'loading' | 'error' | 'ready';

export interface ChartAsset {
  index: number;
  name: string;
  image?: string;
}

interface PricePoint {
  ts: number;
  price: number;
}

interface Hover {
  index: number;
  x: number;
  y: number;
}

const isInverted = (
  points: PricePoint[],
  reference: number,
  labels: { baseIsUnit: boolean; quoteIsSubject: boolean }
) => {
  const latest = points[points.length - 1]?.price ?? 0;
  if (reference > 0 && latest > 0) {
    const asIs = Math.abs(Math.log(latest / reference));
    const flipped = Math.abs(Math.log(1 / latest / reference));
    return flipped < asIs;
  }
  return labels.baseIsUnit && labels.quoteIsSubject;
};

const niceNum = (range: number, round: boolean) => {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let nice: number;
  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else {
    if (fraction <= 1) nice = 1;
    else if (fraction <= 2) nice = 2;
    else if (fraction <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exponent);
};

const computeNiceAxis = (dataMin: number, dataMax: number, tickCount = Y_TICKS) => {
  let low = dataMin;
  let high = dataMax;
  if (low === high) {
    const pad = low === 0 ? 1 : Math.abs(low) * 0.1;
    low -= pad;
    high += pad;
  }

  const step = niceNum(niceNum(high - low, false) / (tickCount - 1), true);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  const round = (value: number) => parseFloat(value.toFixed(decimals));

  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = min; value <= max + step * 0.5; value += step) ticks.push(round(value));

  return { min: round(min), max: round(max), ticks, decimals };
};

const fmtValue = (value: number, decimals: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const fmtAxisDate = (ts: number) => {
  const date = new Date(ts * 1000);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
};

const fmtFullDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

const CrosshairPlugin = {
  id: 'poolCrosshair',
  beforeDatasetsDraw: (chart: any) => {
    const active = chart.tooltip?.getActiveElements?.();
    if (!active?.length) return;

    const { ctx } = chart;
    const { top, bottom } = chart.chartArea;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = CROSSHAIR;
    ctx.setLineDash([3, 4]);
    ctx.moveTo(active[0].element.x, top);
    ctx.lineTo(active[0].element.x, bottom);
    ctx.stroke();
    ctx.restore();
  },
};

const RangeSelector = ({
  range,
  onSelect,
  refreshing,
}: {
  range: Range;
  onSelect: (range: Range) => void;
  refreshing: boolean;
}) => (
  <RangeRow $refreshing={refreshing}>
    {(Object.keys(RANGES) as Range[]).map((option) => (
      <RangeButton
        key={option}
        $active={range === option}
        onClick={() => onSelect(option)}
        disabled={range === option}
      >
        {option}
      </RangeButton>
    ))}
  </RangeRow>
);

const HoverCard = ({
  point,
  subject,
  unit,
  decimals,
  flipped,
  left,
}: {
  point: PricePoint;
  subject: ChartAsset;
  unit: ChartAsset;
  decimals: number;
  flipped: boolean;
  left: number;
}) => (
  <Card style={{ left: `${left}px`, transform: `translateX(${flipped ? -102 : 2}%)` }}>
    <CardRow>
      {subject.image && <CardSprite src={subject.image} alt={subject.name} />}
      <Text size={0.75}>{subject.name}</Text>
    </CardRow>
    <CardRow>
      <Text size={0.65}>Time: {fmtFullDate(point.ts)}</Text>
    </CardRow>
    <CardRow>
      <Text size={0.65} color={GREEN}>
        Price: {fmtValue(point.price, decimals)}
      </Text>
      {unit.image && <UnitSprite src={unit.image} alt={unit.name} />}
    </CardRow>
  </Card>
);

export const Chart = ({
  subject,
  unit,
  referencePrice,
}: {
  subject: ChartAsset;
  unit: ChartAsset;
  referencePrice: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS>();
  const hoverRef = useRef<Hover | null>(null);

  const [points, setPoints] = useState<PricePoint[]>([]);
  const [status, setStatus] = useState<Status>(KamidenClient ? 'loading' : 'offline');
  const [range, setRange] = useState<Range>('30d');
  const [hover, setHover] = useState<Hover | null>(null);

  const hasReference = referencePrice > 0;

  useEffect(() => {
    if (!KamidenClient) return setStatus('offline');
    let stale = false;
    setStatus('loading');

    const [indexA, indexB] =
      subject.index < unit.index ? [subject.index, unit.index] : [unit.index, subject.index];
    const windowSeconds = RANGES[range];
    const fromTs =
      windowSeconds === null ? undefined : Math.floor(Date.now() / 1000) - (windowSeconds - DAY);

    KamidenClient.getPoolPriceHistory({ indexA, indexB, fromTs })
      .then((response) => {
        if (stale) return;
        const parsed = response.points
          .map((point) => ({ ts: point.bucketTs, price: point.price }))
          .filter((point) => point.ts > 0 && point.price > 0 && Number.isFinite(point.price))
          .sort((a, b) => a.ts - b.ts);

        const inverted = isInverted(parsed, referencePrice, {
          baseIsUnit: response.baseIndex === unit.index,
          quoteIsSubject: response.quoteIndex === subject.index,
        });

        setPoints(
          inverted ? parsed.map((point) => ({ ...point, price: 1 / point.price })) : parsed
        );
        setStatus('ready');
      })
      .catch((error) => {
        if (stale) return;
        console.error('[pool chart] price history failed', error);
        setStatus('error');
      });

    return () => {
      stale = true;
    };
  }, [subject.index, unit.index, range, hasReference]);

  /////////////////
  // INTERPRETATION

  const bounds = useMemo(() => {
    if (!points.length) return { min: 0, max: 1, ticks: [0, 1], decimals: 2 };
    const prices = points.map((point) => point.price);
    return computeNiceAxis(Math.min(...prices), Math.max(...prices));
  }, [points]);

  const span = useMemo(() => {
    if (!points.length) return { min: 0, max: 1, ticks: [0, 1] };

    const step = Math.max(1, Math.floor(points.length / X_LABEL_DIVISOR));
    const ticks: number[] = [];
    for (let i = 0; i < points.length; i += step) ticks.push(points[i].ts);

    return { min: points[0].ts, max: points[points.length - 1].ts, ticks };
  }, [points]);

  /////////////////
  // RENDERING

  useEffect(() => {
    setHover(null);
    hoverRef.current = null;
    chartRef.current?.destroy();
    chartRef.current = undefined;
    if (points.length < 2) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const trackHover = ({ tooltip }: any) => {
      if (!tooltip.opacity) {
        if (!hoverRef.current) return;
        hoverRef.current = null;
        return setHover(null);
      }

      const index = tooltip.dataPoints?.[0]?.dataIndex;
      if (index === undefined) return;

      const next = { index, x: tooltip.caretX, y: tooltip.caretY };
      const previous = hoverRef.current;
      if (previous && previous.index === index && previous.x === next.x && previous.y === next.y)
        return;
      hoverRef.current = next;
      setHover(next);
    };

    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Price',
            data: points.map((point) => ({ x: point.ts, y: point.price })),
            borderColor: GREEN,
            backgroundColor: GREEN,
            borderWidth: 1.5,
            pointRadius: points.length > 120 ? 0 : 2.5,
            pointHoverRadius: 4,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            min: bounds.min,
            max: bounds.max,
            border: { display: false },
            grid: { color: GRID, z: -1 },
            afterBuildTicks: (axis: any) => {
              axis.ticks = bounds.ticks.map((value) => ({ value }));
            },
            ticks: {
              color: TICK,
              font: { family: 'Pixel', size: 9 },
              autoSkip: false,
              callback: (value: any) => fmtValue(Number(value), bounds.decimals),
            },
          },
          x: {
            type: 'linear',
            min: span.min,
            max: span.max,
            border: { display: false },
            grid: { color: GRID, z: -1 },
            afterBuildTicks: (axis: any) => {
              axis.ticks = span.ticks.map((value) => ({ value }));
            },
            ticks: {
              color: TICK,
              font: { family: 'Pixel', size: 9 },
              maxRotation: 0,
              autoSkip: false,
              callback: (value: any) => fmtAxisDate(Number(value)),
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false, external: trackHover },
        },
      },
      plugins: [CrosshairPlugin],
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = undefined;
    };
  }, [points, bounds, span]);

  const selectRange = (option: Range) => {
    playClick();
    setRange(option);
  };

  if (status === 'offline') return <EmptyText text={['Price history unavailable.']} size={1} />;

  const chartWidth = canvasRef.current?.clientWidth ?? 0;
  const refreshing = status === 'loading' && points.length > 0;

  const renderBody = () => {
    if (status === 'error')
      return (
        <EmptyBox>
          <EmptyText text={['Could not load price history.', 'Try again later!']} size={0.9} />
        </EmptyBox>
      );

    if (status === 'loading' && !points.length)
      return (
        <EmptyBox>
          <EmptyText text={['Loading price history...']} size={0.9} />
        </EmptyBox>
      );

    if (points.length > 1)
      return (
        <ChartBox>
          <canvas ref={canvasRef} />
          {hover && (
            <HoverCard
              point={points[hover.index]}
              subject={subject}
              unit={unit}
              decimals={bounds.decimals}
              flipped={hover.x > chartWidth / 2}
              left={hover.x}
            />
          )}
        </ChartBox>
      );

    return (
      <EmptyBox>
        <EmptyText
          text={
            points.length === 1
              ? ['Only one price point so far.', 'Check back soon!']
              : ['No trades recorded yet.', 'Be the first!']
          }
          size={0.9}
        />
      </EmptyBox>
    );
  };

  return (
    <Container>
      <Header>
        <HeaderLabel>price history</HeaderLabel>
        <RangeSelector range={range} onSelect={selectRange} refreshing={refreshing} />
      </Header>
      {renderBody()}
    </Container>
  );
};

/////////////////
// STYLES

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vh;
  border: 0.12vw solid #e0e0e0;
  border-radius: 0.6vw;
  background: #fafafa;
  padding: 0.8vw;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
`;

const HeaderLabel = styled.div`
  font-family: Pixel;
  font-size: 0.72vw;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.12vw;
`;

const RangeRow = styled.div<{ $refreshing: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.3vw;
  flex-shrink: 0;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.5 : 1)};
  transition: opacity 0.12s;
`;

const RangeButton = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  height: 1.8vw;
  padding: 0 0.5vw;
  border: 0.1vw solid ${({ $active }) => ($active ? '#a0c0e8' : '#ccc')};
  border-radius: 0.4vw;
  background: ${({ $active }) => ($active ? '#e8f0fe' : '#fff')};
  color: ${({ $active }) => ($active ? '#333' : '#555')};
  font-family: Pixel;
  font-size: 0.65vw;
  cursor: pointer;
  pointer-events: auto;
  transition:
    background 0.12s,
    border-color 0.12s;
  &:hover {
    background: #e8f0fe;
    border-color: #a0c0e8;
  }
  &:disabled {
    cursor: default;
    pointer-events: none;
  }
`;

const ChartBox = styled.div`
  position: relative;
  width: 100%;
  height: 15vw;
`;

const EmptyBox = styled.div`
  padding: 3vh 0;
`;

const Card = styled.div`
  position: absolute;
  top: 0.6vw;
  display: flex;
  flex-direction: column;
  gap: 0.2vh;
  border: 0.12vw solid #e0e0e0;
  border-radius: 0.5vw;
  background: #fff;
  padding: 0.6vw;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
`;

const CardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const CardSprite = styled.img`
  width: 1.2vw;
  height: 1.2vw;
  image-rendering: pixelated;
  user-drag: none;
  flex-shrink: 0;
`;

const UnitSprite = styled.img`
  width: 0.8vw;
  height: 0.8vw;
  image-rendering: pixelated;
  user-drag: none;
  flex-shrink: 0;
`;
