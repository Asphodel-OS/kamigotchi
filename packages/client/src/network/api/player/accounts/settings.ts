import { BigNumberish } from '@ethersproject/bignumber';

export const settingsAPI = (systems: any) => {
  /**
   * @dev (Owner) set the Account's profile picture to that of an owned Kami
   *
   * @param kamiID entityID of the Kami
   */
  const setPFP = (kamiID: BigNumberish) => {
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
  const setOperator = (operatorAddress: BigNumberish) => {
    return systems['system.account.set.operator'].executeTyped(operatorAddress);
  };

  return {
    name: setName,
    operator: setOperator,
    pfp: setPFP,
  };
};
