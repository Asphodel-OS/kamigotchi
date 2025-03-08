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
