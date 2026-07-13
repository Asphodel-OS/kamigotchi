import { Pool } from './types';

// client mirrors of LibPool's constant-product math. all rounding floors
// in the pool's favor, matching the contracts exactly

// output for an exact input, after the swap fee
export const calcAmountOut = (
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number
): number => {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) return 0;
  const amountInWithFee = amountIn * (10000 - feeBps);
  return Math.floor((amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee));
};

// equivalent value of amountA in item B at the current reserve ratio
export const quote = (amountA: number, reserveA: number, reserveB: number): number => {
  if (reserveA <= 0) return 0;
  return Math.floor((amountA * reserveB) / reserveA);
};

// shares minted for a deposit of (amtA, amtB)
export const calcSharesMinted = (pool: Pool, amtA: number, amtB: number): number => {
  if (pool.reserveA <= 0 || pool.reserveB <= 0) return 0;
  return Math.min(
    Math.floor((amtA * pool.totalSupply) / pool.reserveA),
    Math.floor((amtB * pool.totalSupply) / pool.reserveB)
  );
};

// amounts returned for burning shares
export const calcRemoveAmounts = (pool: Pool, shares: number): [number, number] => {
  if (pool.totalSupply <= 0) return [0, 0];
  return [
    Math.floor((shares * pool.reserveA) / pool.totalSupply),
    Math.floor((shares * pool.reserveB) / pool.totalSupply),
  ];
};

// min-received bound for a slippage tolerance in bps (e.g. 50 = 0.5%)
export const applySlippage = (amountOut: number, slippageBps: number): number => {
  return Math.floor((amountOut * (10000 - slippageBps)) / 10000);
};
