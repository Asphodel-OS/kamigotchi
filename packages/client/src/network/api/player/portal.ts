import { BigNumberish } from 'ethers';

/**
 * @dev A bridge is actually a staking mechanism for ERC721s or ERC20s
 * to use within the Game World.
 */
export const portalAPI = (systems: any) => {
  /////////////////
  // ERC20

  const depositERC20 = (itemIndex: number, itemAmt: number) => {
    return systems['system.erc20.portal'].deposit(itemIndex, itemAmt);
  };

  const initWithdrawERC20 = (itemIndex: number, itemAmt: number) => {
    return systems['system.erc20.portal'].initWithdraw(itemIndex, itemAmt);
  };

  const claimERC20 = (receiptID: BigNumberish) => {
    return systems['system.erc20.portal'].claim(receiptID);
  };

  const cancelERC20 = (receiptID: BigNumberish) => {
    return systems['system.erc20.portal'].cancel(receiptID);
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
      withdraw: initWithdrawERC20,
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
