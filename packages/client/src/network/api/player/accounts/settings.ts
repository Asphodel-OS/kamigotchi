import { SystemQueue } from 'engine/queue';

export const settingsAPI = (systems: SystemQueue<any>) => {
  /**
   * @dev sets a bio for the player's account
   * @param string bio to set
   */
  const setBio = (bio: string) => {
    return systems['system.account.set.bio'].executeTyped(bio);
  };
  /**
   * @dev (Owner) set the Account's profile picture to that of an owned Kami
   *
   * @param kamiID entityID of the Kami
   */
  const setPFP = (kamiID: string) => {
    return systems['system.account.set.pfp'].executeTyped(kamiID);
  };

  /**
   * @dev (Owner) rename the account
   *
   * @param name new name
   */
  const setName = (name: string) => {
    return systems['system.account.set.name'].executeTyped(name);
  };

  /**
   * @dev (Owner) set the Operator address on an account
   *
   * @param operatorAddress Operator EOA to update to
   */
  const setOperator = (operatorAddress: string) => {
    return systems['system.account.set.operator'].executeTyped(operatorAddress);
  };

  return {
    bio: setBio,
    name: setName,
    operator: setOperator,
    pfp: setPFP,
  };
};
