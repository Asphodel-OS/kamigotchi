import { BigNumberish } from 'ethers';

export const onyxAPI = (systems: any) => {
  // (Owner) rename a pet by spending onyx
  const rename = (kamiID: BigNumberish, name: string) => {
    return systems['system.kami.onyx.rename'].executeTyped(kamiID, name);
  };

  // (Owner) revive a pet by spending onyx
  const revive = (kamiID: BigNumberish) => {
    return systems['system.kami.onyx.revive'].executeTyped(kamiID);
  };

  // (Owner) respec a pet by spending onyx
  const respec = (kamiID: BigNumberish) => {
    return systems['system.kami.onyx.respec'].executeTyped(kamiID);
  };

  return {
    rename,
    revive,
    respec,
  };
};
