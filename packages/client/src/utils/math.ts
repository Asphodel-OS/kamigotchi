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

export const getPercentCompletion = (curr: number, tot: number) => {
  if (tot === 0) return 0;
  if (curr > tot) return 100;
  const truncated = Math.floor((curr / tot) * 1000) / 10;
  return Math.min(100, truncated);
};
