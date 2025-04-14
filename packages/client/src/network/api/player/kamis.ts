import { BigNumberish } from 'ethers';

export const kamisAPI = (systems: any) => {
  /////////////////
  // DIRECT

  // level a pet, if it has enough experience
  const level = (kamiID: BigNumberish) => {
    return systems['system.kami.level'].executeTyped(kamiID);
  };

  // name / rename a pet
  const name = (kamiID: BigNumberish, name: string) => {
    return systems['system.kami.name'].executeTyped(kamiID, name);
  };

  /////////////////
  // HARVESTS

  /**
   * @dev retrieves the amount due from a passive deposit harvest and resets the starting point
   *
   * @param harvestIDs array of harvestIDs
   */
  const collectHarvest = (harvestIDs: BigNumberish[]) => {
    return systems['system.harvest.collect'].executeBatched(harvestIDs, { gasLimit: 2530000 });
  };

  /**
   * @dev liquidates a harvest, if able to, using the specified pet
   *
   * @param harvestID harvestID
   * @param kamiID kamiID
   */
  const liquidateHarvest = (harvestID: BigNumberish, kamiID: BigNumberish) => {
    return systems['system.harvest.liquidate'].executeTyped(harvestID, kamiID, {
      // gasLimit: 3230000,
    });
  };

  /**
   * @dev starts a deposit harvest for a character. If none exists, it creates one.
   *
   * @param kamiIDs array of kamiIDs
   * @param nodeIndex nodeIndex
   */
  const startHarvest = (kamiIDs: BigNumberish[], nodeIndex: BigNumberish) => {
    return systems['system.harvest.start'].executeBatched(kamiIDs, nodeIndex, 0, 0, {
      gasLimit: 2200000,
    });
  };

  /**
   * @dev stop a harvest and retrieves the amount to collect
   *
   * @param harvestIDs array of harvestIDs
   */
  const stopHarvest = (harvestIDs: BigNumberish[]) => {
    return systems['system.harvest.stop'].executeBatched(harvestIDs, { gasLimit: 2530000 });
  };

  /////////////////
  // ITEMS

  // feed a pet using a Pet Item
  const useItem = (kamiID: BigNumberish, itemIndex: number) => {
    return systems['system.kami.use.item'].executeTyped(kamiID, itemIndex);
  };

  /////////////////
  // SKILLS

  // upgrade a pet's skill
  const upgradeSkill = (kamiID: BigNumberish, skillIndex: number) => {
    return systems['system.skill.upgrade'].executeTyped(kamiID, skillIndex);
  };

  // reset a pet's skill
  const resetSkill = (kamiID: BigNumberish) => {
    return systems['system.skill.reset'].executeTyped(kamiID);
  };

  return {
    level,
    name,
    harvest: {
      collect: collectHarvest,
      liquidate: liquidateHarvest,
      start: startHarvest,
      stop: stopHarvest,
    },
    item: {
      use: useItem,
    },
    skill: {
      upgrade: upgradeSkill,
      reset: resetSkill,
    },
  };
};
