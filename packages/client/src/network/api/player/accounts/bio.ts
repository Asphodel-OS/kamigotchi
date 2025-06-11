export const bioAPI = (systems: any) => {
  /**
   * @dev sets a bio for the player's account
   * @param string bio to set
   */
  const set = (bio: string) => {
    return systems['system.account.set.bio'].executeTyped(bio);
  };

  return {
    set,
  };
};
