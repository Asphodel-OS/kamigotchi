import { SystemQueue } from 'engine/queue';
import { BigNumberish } from 'ethers';

export const questsAPI = (systems: SystemQueue<any>) => {
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
