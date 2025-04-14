import { BigNumberish } from 'ethers';

export const skillsAPI = (systems: any) => {
  // upgrade a pet's skill
  const upgrade = (kamiID: BigNumberish, skillIndex: number) => {
    return systems['system.skill.upgrade'].executeTyped(kamiID, skillIndex);
  };

  // reset a pet's skill
  const reset = (kamiID: BigNumberish) => {
    return systems['system.skill.reset'].executeTyped(kamiID);
  };

  return {
    upgrade,
    reset,
  };
};
