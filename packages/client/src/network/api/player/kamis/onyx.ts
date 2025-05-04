import { BigNumberish } from 'ethers';

export const onyxAPI = (systems: any) => {
  // revive a pet by spending onyx
  const revive = (kamiID: BigNumberish) => {
    return systems['system.kami.onyx.revive'].executeTyped(kamiID);
  };

  return {
    revive,
  };
};
