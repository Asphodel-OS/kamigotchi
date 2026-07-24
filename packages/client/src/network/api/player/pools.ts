import { SystemQueue } from 'engine/queue';

export const poolsAPI = (systems: SystemQueue<any>) => {
  /**
   * @dev swap an exact amount of one pool item for the other
   *
   * @param indexIn item index being sold to the pool
   * @param indexOut item index being bought from the pool
   * @param amountIn exact amount in
   * @param minAmountOut slippage bound on the amount received
   */
  const swap = (indexIn: number, indexOut: number, amountIn: number, minAmountOut: number) => {
    return systems['system.pool'].swap(indexIn, indexOut, amountIn, minAmountOut);
  };

  /**
   * @dev deposit both pool items at the current reserve ratio for LP shares.
   * settles between desired/min bounds like the UniswapV2 router
   */
  const addLiquidity = (
    indexA: number,
    indexB: number,
    amountADesired: number,
    amountBDesired: number,
    amountAMin: number,
    amountBMin: number
  ) => {
    return systems['system.pool'].addLiquidity(
      indexA,
      indexB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin
    );
  };

  /**
   * @dev burn LP shares for a pro-rata slice of both reserves
   */
  const removeLiquidity = (
    indexA: number,
    indexB: number,
    shares: number,
    amountAMin: number,
    amountBMin: number
  ) => {
    return systems['system.pool'].removeLiquidity(indexA, indexB, shares, amountAMin, amountBMin);
  };

  return {
    swap,
    liquidity: {
      add: addLiquidity,
      remove: removeLiquidity,
    },
  };
};
