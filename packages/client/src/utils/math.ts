import cdf from '@stdlib/stats-base-dists-normal-cdf';

const logDivMap = new Map<number, number>();
const cdfMap = new Map<number, number>();

// key is bitpacked numerator and denominator (assume 16 bits or less each)
export const memoLogDiv = (numerator: number, denominator: number) => {
  const key = (numerator << 16) | denominator;
  if (!logDivMap.has(key)) {
    const result = Math.log(key);
    logDivMap.set(key, result);
  }
  return logDivMap.get(key)!;
};

// memoized cdf lookup that assumes sigma=1 mu=0
export const memoCDF = (stdv: number) => {
  if (!cdfMap.has(stdv)) {
    const result = cdf(stdv, 0, 1);
    cdfMap.set(stdv, result);
  }
  return cdfMap.get(stdv)!;
};

// calculate the percent of curr/tot. rounds down
export const calcPercent = (curr: number, tot: number, decimals = 1) => {
  if (tot === 0) return 0;
  const boost = 10 ** decimals;
  return Math.floor((curr / tot) * 100 * boost) / boost;
};

// calculate the percent of curr/tot. round down, cap at 100
export const calcPercentCompletion = (curr: number, tot: number, decimals = 1) => {
  if (curr >= tot) return 100;
  const truncated = calcPercent(curr, tot, decimals);
  return Math.min(100, truncated);
};
