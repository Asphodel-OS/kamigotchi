import { BigNumberish } from '@ethersproject/bignumber';

/*******************
 *  TRADES
 *
 * @dev A trade is a transaction between two accounts.
 * It can be used to buy or sell items. with other players.
 */
export const tradesAPI = (systems: any) => {
  /**
   * @dev create a trade.
   *
   * @param buyIndices indices of items to buy
   * @param buyAmts amounts of items to buy
   * @param sellIndices indices of items to sell
   * @param sellAmts amounts of items to sell
   * @param targetID entityID of the target account
   */
  const create = (
    buyIndices: Number[],
    buyAmts: BigNumberish[],
    sellIndices: Number[],
    sellAmts: BigNumberish[],
    targetID: BigNumberish
  ) => {
    return systems['system.trade.create'].executeTyped(
      buyIndices,
      buyAmts,
      sellIndices,
      sellAmts,
      targetID
    );
  };

  /**
   * @dev execute a trade. A trade is a transaction between two accounts.
   * It can be used to buy or sell items. with other players.
   *
   * @param tradeID entityID of the trade
   */
  const execute = (tradeID: BigNumberish) => {
    return systems['system.trade.execute'].executeTyped(tradeID);
  };

  /**
   * @dev cancel a trade. A trade is a transaction between two accounts.
   * It can be used to buy or sell items. with other players.
   *
   * @param tradeID entityID of the trade
   */
  const cancel = (tradeID: BigNumberish) => {
    return systems['system.trade.cancel'].executeTyped(tradeID);
  };

  return {
    create,
    execute,
    cancel,
  };
};
