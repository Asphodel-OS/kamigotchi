// price readout: whole numbers render without thousands separators (a comma
// could be misread as a decimal point); below 100 we clamp to 2 decimals
// (trailing zeros trimmed). a nonzero price that rounds to 0 shows "<0.01" so a
// cheap item never reads as free
export const fmtPrice = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 100) return String(Math.round(n));
  const rounded = Number(n.toFixed(2));
  return rounded === 0 ? '<0.01' : rounded.toString();
};

/////////////////
// PRICE CHART

export const DAY = 3600 * 24;

const Y_TICKS = 5;

export const RANGES = {
  '7d': DAY * 7,
  '30d': DAY * 30,
  Max: null,
} as const;

export type Range = keyof typeof RANGES;

export interface PricePoint {
  ts: number;
  price: number;
}

export const isInverted = (
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

export const computeNiceAxis = (dataMin: number, dataMax: number, tickCount = Y_TICKS) => {
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

export const fmtValue = (value: number, decimals: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const fmtAxisDate = (ts: number) => {
  const date = new Date(ts * 1000);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
};

export const fmtFullDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
