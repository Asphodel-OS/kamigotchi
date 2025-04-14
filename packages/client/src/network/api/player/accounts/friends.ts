import { BigNumberish } from '@ethersproject/bignumber';

export const friendsAPI = (systems: any) => {
  /**
   * @dev send a friend request
   * @param targetAddr owner address of the target account
   */
  const request = (targetAddr: string) => {
    return systems['system.friend.request'].executeTyped(targetAddr);
  };

  /**
   * @dev accept a friend request
   * @param requestID entityID of the friend request
   */
  const accept = (requestID: BigNumberish) => {
    return systems['system.friend.accept'].executeTyped(requestID);
  };

  /**
   * @dev cancel a friend request, an existing friend, or a block
   * @param entityID entityID of the friendship entity
   */
  const cancel = (entityID: BigNumberish) => {
    return systems['system.friend.cancel'].executeTyped(entityID);
  };

  /**
   * @dev block an account
   * @param targetAddr owner address of the target account
   */
  const block = (targetAddr: string) => {
    return systems['system.friend.block'].executeTyped(targetAddr);
  };

  return {
    request,
    accept,
    cancel,
    block,
  };
};
