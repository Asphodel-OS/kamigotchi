export const getPercentCompletion = (curr: number, tot: number) => {
  if (tot === 0) return 0;
  if (curr > tot) return 100;
  const truncated = Math.floor((curr / tot) * 1000) / 10;
  return Math.min(100, truncated);
};
