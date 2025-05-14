import { BigNumberish } from 'ethers';

export const harvestsAPI = (systems: any) => {
  /**
   * @dev retrieves the amount due from a passive deposit harvest and resets the starting point
   *
   * @param harvestIDs array of harvestIDs
   */
  const collect = (harvestIDs: BigNumberish[]) => {
    return systems['system.harvest.collect'].executeBatched(harvestIDs, { gasLimit: 2530000 });
  };

  /**
   * @dev liquidates a harvest, if able to, using the specified pet
   *
   * @param harvestID harvestID
   * @param kamiID kamiID
   */
  const liquidate = (harvestID: BigNumberish, kamiID: BigNumberish) => {
    return systems['system.harvest.liquidate'].executeTyped(harvestID, kamiID);
  };

  /**
   * @dev starts a deposit harvest for a character. If none exists, it creates one.
   *
   * @param kamiIDs array of kamiIDs
   * @param nodeIndex nodeIndex
   */
  const start = (kamiIDs: BigNumberish[], nodeIndex: BigNumberish) => {
    return systems['system.harvest.start'].executeBatched(kamiIDs, nodeIndex, 0, 0);
  };

  /**
   * @dev stop a harvest and retrieves the amount to collect
   *
   * @param harvestIDs array of harvestIDs
   */
  const stop = (harvestIDs: BigNumberish[]) => {
    return systems['system.harvest.stop'].executeBatched(harvestIDs, { gasLimit: 2530000 });
  };

  return {
    collect,
    liquidate,
    start,
    stop,
  };
};
