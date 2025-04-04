import { BigNumberish } from '@ethersproject/bignumber';

export function harvestAPI(systems: any) {
  // @dev retrieves the amount due from a passive deposit harvest and resets the starting point
  function collect(harvestIDs: BigNumberish[]) {
    return systems['system.harvest.collect'].executeBatched(harvestIDs, { gasLimit: 2500000 });
  }

  // @dev liquidates a harvest, if able to, using the specified pet
  function liquidate(harvestID: BigNumberish, kamiID: BigNumberish) {
    return systems['system.harvest.liquidate'].executeTyped(harvestID, kamiID, {
      gasLimit: 3200000,
    });
  }

  // @dev starts a deposit harvest for a character. If none exists, it creates one.
  function start(kamiIDs: BigNumberish[], nodeIndex: BigNumberish) {
    return systems['system.harvest.start'].executeBatched(kamiIDs, nodeIndex, 0, 0, {
      gasLimit: 2200000,
    });
  }

  // @dev retrieves the amount due from a passive deposit harvest and stops it.
  function stop(harvestIDs: BigNumberish[]) {
    return systems['system.harvest.stop'].executeBatched(harvestIDs, { gasLimit: 2500000 });
  }

  return {
    collect,
    liquidate,
    start,
    stop,
  };
}
