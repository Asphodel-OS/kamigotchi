/**
 * @dev A bridge is actually a staking mechanism for ERC721s or ERC20s
 * to use within the Game World.
 */
export const bridgeAPI = (systems: any) => {
  /////////////////
  // ERC20

  const depositERC20 = (itemIndex: number, itemAmt: number) => {
    return systems['system.token.bridge.deposit'].deposit(itemIndex, itemAmt);
  };

  const initiateWithdrawERC20 = (itemIndex: number, itemAmt: number) => {
    return systems['system.token.bridge.withdraw'].initiateWithdraw(itemIndex, itemAmt);
  };

  const claimERC20 = (receiptID: number) => {
    return systems['system.token.bridge.withdraw'].claim(receiptID);
  };

  const cancelERC20 = (receiptID: number) => {
    return systems['system.token.bridge.withdraw'].cancel(receiptID);
  };

  /////////////////
  // KAMI

  /**
   * @dev deposits pet from outside -> game world
   * @param index  ERC721 token ID (equals IndexKami for Kamis)
   */
  const stakeKami = (index: number) => {
    return systems['system.kami721.stake'].executeTyped(index);
  };

  /**
   * @dev deposits multiple pets from outside -> game world
   * @param indices
   * @returns
   */
  const batchStakeKami = (indices: number[]) => {
    return systems['system.kami721.stake'].executeBatch(indices);
  };

  /**
   * @dev withdraws pet from game world -> outside
   * @param index  ERC721 token ID (equals IndexKami for Kamis)
   */
  const unstakeKami = (index: number) => {
    return systems['system.kami721.unstake'].executeTyped(index);
  };

  /**
   * @dev withdraws multiple pets from game world -> outside
   * @param indices
   * @returns
   */
  const batchUnstakeKami = (indices: number[]) => {
    return systems['system.kami721.unstake'].executeBatch(indices);
  };

  return {
    ERC20: {
      deposit: depositERC20,
      withdraw: initiateWithdrawERC20,
      claim: claimERC20,
      cancel: cancelERC20,
    },
    ERC721: {
      kami: {
        stake: stakeKami,
        unstake: unstakeKami,
        batch: {
          stake: batchStakeKami,
          unstake: batchUnstakeKami,
        },
      },
    },
  };
};
