import { Pool } from './types';

// client mirrors of LibPool's constant-product math. all intermediate math is
// BigInt — the products (e.g. amountIn × 9970 × reserveOut) exceed
// Number.MAX_SAFE_INTEGER once reserves reach the low millions — with floors
// matching the contracts exactly. results are returned as number (game
// amounts are far below 2^53 even when intermediates are not)

const BPS = 10_000n;

// output for an exact input, after the swap fee
export const calcAmountOut = (
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number
): number => {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) return 0;
  const amountInWithFee = BigInt(Math.floor(amountIn)) * (BPS - BigInt(feeBps));
  const out = (amountInWithFee * BigInt(reserveOut)) / (BigInt(reserveIn) * BPS + amountInWithFee);
  return Number(out);
};

// input needed for an exact output, after the swap fee: the smallest amountIn
// whose calcAmountOut is >= amountOut at current reserves (ceil division —
// exact minimum, never overpays). 0 when the ask can't clear the reserve
export const calcAmountIn = (
  amountOut: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number
): number => {
  if (amountOut <= 0 || reserveIn <= 0 || amountOut >= reserveOut) return 0;
  const numerator = BigInt(reserveIn) * BigInt(Math.floor(amountOut)) * BPS;
  const denominator = BigInt(reserveOut - Math.floor(amountOut)) * (BPS - BigInt(feeBps));
  return Number((numerator + denominator - 1n) / denominator);
};

// equivalent value of amountA in item B at the current reserve ratio
export const quote = (amountA: number, reserveA: number, reserveB: number): number => {
  if (reserveA <= 0) return 0;
  return Number((BigInt(Math.floor(amountA)) * BigInt(reserveB)) / BigInt(reserveA));
};

// shares minted for a deposit of (amtA, amtB)
export const calcSharesMinted = (pool: Pool, amtA: number, amtB: number): number => {
  if (pool.reserveA <= 0 || pool.reserveB <= 0) return 0;
  const supply = BigInt(pool.totalSupply);
  const byA = (BigInt(Math.floor(amtA)) * supply) / BigInt(pool.reserveA);
  const byB = (BigInt(Math.floor(amtB)) * supply) / BigInt(pool.reserveB);
  return Number(byA < byB ? byA : byB);
};

// amounts returned for burning shares
export const calcRemoveAmounts = (pool: Pool, shares: number): [number, number] => {
  if (pool.totalSupply <= 0) return [0, 0];
  const s = BigInt(Math.floor(shares));
  const supply = BigInt(pool.totalSupply);
  return [
    Number((s * BigInt(pool.reserveA)) / supply),
    Number((s * BigInt(pool.reserveB)) / supply),
  ];
};

// min-received bound for a slippage tolerance in bps (e.g. 50 = 0.5%)
export const applySlippage = (amountOut: number, slippageBps: number): number => {
  return Number((BigInt(Math.floor(amountOut)) * (BPS - BigInt(slippageBps))) / BPS);
};
