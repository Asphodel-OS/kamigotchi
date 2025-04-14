export const chatAPI = (systems: any) => {
  /**
   * @dev send a chat message in the current room
   * @param message message to send
   */
  const send = (message: string) => {
    return systems['system.chat'].executeTyped(message);
  };

  return {
    send,
  };
};
