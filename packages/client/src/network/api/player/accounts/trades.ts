import { BigNumberish } from '@ethersproject/bignumber';

/*******************
 *  TRADES
 * @title Trade interaction API for Players
 * @notice A Trade represents an exchange of items between two Accounts.
 */
export const tradesAPI = (systems: any) => {
  /**
   * @notice create a Trade.
   * @dev transfers SellOrder items from the caller (Maker) to the Trade entity
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
   * @notice execute a Trade.
   * @dev exchanges items between the caller and the Trade entity
   * @dev cannot be called by the Maker. must be called by listed Taker if one is specified
   * @dev Trade must be in PENDING state
   * @param tradeID entityID of the trade
   */
  const execute = (tradeID: BigNumberish) => {
    return systems['system.trade.execute'].executeTyped(tradeID);
  };

  /**
   * @notice complete a Trade.
   * @dev transfers BuyOrder items to the Maker
   * @dev can only be called by the Maker. Trade must be in EXECUTED state
   * @param tradeID entityID of the trade
   */
  const complete = (tradeID: BigNumberish) => {
    return systems['system.trade.complete'].executeTyped(tradeID);
  };

  /**
   * @notice cancel a Trade.
   * @dev returns SellOrder items to the Maker
   * @dev can only be called by the Maker. Trade must be in PENDING state
   * @param tradeID entityID of the trade
   */
  const cancel = (tradeID: BigNumberish) => {
    return systems['system.trade.cancel'].executeTyped(tradeID);
  };

  /////////////////
  // RETURN

  return {
    create,
    execute,
    complete,
    cancel,
  };
};
