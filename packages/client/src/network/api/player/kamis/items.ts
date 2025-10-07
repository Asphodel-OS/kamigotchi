import { BigNumberish } from 'ethers';

export const itemsAPI = (systems: any) => {
  // feed a pet using a Pet Item
  const use = (kamiID: BigNumberish, itemIndex: number) => {
    return systems['system.kami.use.item'].executeTyped(kamiID, itemIndex);
  };

  // use an item on an enemy kami
  const cast = (kamiID: BigNumberish, itemIndex: number) => {
    return systems['system.kami.cast.item'].executeTyped(kamiID, itemIndex);
  };

  return {
    use,
    cast,
  };
};
