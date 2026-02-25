import { SystemQueue } from 'engine/queue';

export const kamiSendAPI = (systems: SystemQueue<any>) => {
  function send(kamiIndex: number, toAddress: string) {
    return systems['system.kami.send']['executeTyped(uint32,address)'](kamiIndex, toAddress);
  }

  function sendBatch(kamiIndices: number[], toAddress: string) {
    return systems['system.kami.send']['executeTyped(uint32[],address)'](kamiIndices, toAddress);
  }

  return { send, sendBatch };
};
