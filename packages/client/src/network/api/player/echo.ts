/**
 * @dev an echo is a forced emit of onchain data. Used to resolve lagging indexer issues.
 */
export const echoAPI = (systems: any) => {
  /**
   * @dev echo an Account's Kami data.
   */
  const kamis = () => {
    return systems['system.echo.kamis'].executeTyped();
  };

  /**
   * @dev echo an Account's Room data.
   */
  const room = () => {
    return systems['system.echo.room'].executeTyped();
  };

  return {
    kamis,
    room,
  };
};
