import { SystemQueue } from 'engine/queue';
import { BigNumberish } from 'ethers';

export const equipmentAPI = (systems: SystemQueue<any>) => {
  // equip an item to a kami
  const equip = (kamiID: BigNumberish, itemIndex: number) => {
    return systems['system.kami.equip'].executeTyped(kamiID, itemIndex);
  };

  // unequip an item from a kami by slot type
  const unequip = (kamiID: BigNumberish, slotType: string) => {
    return systems['system.kami.unequip'].executeTyped(kamiID, slotType);
  };

  return {
    equip,
    unequip,
  };
};
