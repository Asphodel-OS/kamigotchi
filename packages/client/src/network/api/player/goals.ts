/**
 * @dev A Goal is a special type of "quest" that players complete collectively.
 */
export const goalsAPI = (systems: any) => {
  /**
   * @dev contributes to a goal
   * @param goalIndex index of the goal
   * @param amt amount to contribute
   */
  const contribute = (goalIndex: number, amt: number) => {
    return systems['system.goal.contribute'].executeTyped(goalIndex, amt);
  };

  /**
   * @dev claims a reward from a goal
   * @param goalIndex index of the goal
   */
  const claim = (goalIndex: number) => {
    return systems['system.goal.claim'].executeTyped(goalIndex);
  };

  return {
    contribute,
    claim,
  };
};
