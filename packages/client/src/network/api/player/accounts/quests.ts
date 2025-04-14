import { BigNumberish } from '@ethersproject/bignumber';

export const questsAPI = (systems: any) => {
  /**
   * @dev accept a Quest for an Account
   * @param index index of the Quest
   */
  const accept = (index: number) => {
    return systems['system.quest.accept'].executeTyped(index);
  };

  /**
   * @dev accept a Quest for an Account
   * @param index index of the Quest
   */
  const complete = (id: BigNumberish) => {
    return systems['system.quest.complete'].executeTyped(id);
  };

  return {
    accept,
    complete,
  };
};
