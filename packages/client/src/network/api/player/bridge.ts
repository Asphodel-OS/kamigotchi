import { BigNumberish } from '@ethersproject/bignumber';

/**
 * @dev A bridge is actually a staking mechanism for ERC721s or ERC20s
 * to use within the Game World.
 */
export const bridgeAPI = (systems: any) => {
  /////////////////
  //   ERC721

  /**
   * @dev deposits pet from outside -> game world
   * @param tokenID  ERC721 token ID (equals IndexKami for Kamis)
   */
  const depositERC721 = (tokenID: BigNumberish) => {
    return systems['system.kami721.stake'].executeTyped(tokenID);
  };

  /**
   * @dev withdraws pet from game world -> outside
   * @param tokenID  ERC721 token ID (equals IndexKami for Kamis)
   */
  const withdrawERC721 = (tokenID: BigNumberish) => {
    return systems['system.kami721.unstake'].executeTyped(tokenID);
  };

  return {
    ERC20: {},
    ERC721: {
      deposit: depositERC721,
      withdraw: withdrawERC721,
    },
  };
};
