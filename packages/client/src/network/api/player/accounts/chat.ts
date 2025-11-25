import { SystemQueue } from 'engine/queue';

export const chatAPI = (systems: SystemQueue<any>) => {
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
