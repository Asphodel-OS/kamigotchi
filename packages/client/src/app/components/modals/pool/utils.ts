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
