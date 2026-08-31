import { fmtAxisDate, fmtValue } from './utils';

const GRID = '#e8e8e8';
const CROSSHAIR = '#bbb';
const TICK = '#999';

type Axis = { min: number; max: number; ticks: number[]; decimals: number };
type Span = { min: number; max: number; ticks: number[] };

export const CrosshairPlugin = {
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

export const RightEdgePlugin = {
  id: 'poolRightEdge',
  beforeDatasetsDraw: (chart: any) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID;
    ctx.moveTo(chartArea.right, chartArea.top);
    ctx.lineTo(chartArea.right, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

export const buildChartOptions = (bounds: Axis, span: Span, trackHover: (args: any) => void) => ({
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
});
