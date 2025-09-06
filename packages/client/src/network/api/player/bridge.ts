/**
 * @dev A bridge is actually a staking mechanism for ERC721s or ERC20s
 * to use within the Game World.
 */
export const bridgeAPI = (systems: any) => {
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

  const batchTransferKami = (indices: number[], to: string) => {
    return systems['system.kami721.transfer'].batchTransferToSingle(indices, to);
  };

  const batchTransferKamiToMultiple = (indices: number[], tos: string[]) => {
    return systems['system.kami721.transfer'].batchTransferToMultiple(indices, tos);
  };

  return {
    ERC20: {},
    ERC721: {
      kami: {
        stake: stakeKami,
        unstake: unstakeKami,
        batch: {
          stake: batchStakeKami,
          unstake: batchUnstakeKami,
          transfer: batchTransferKami,
          transferToMultiple: batchTransferKamiToMultiple,
        },
      },
    },
  };
};
