import { BigNumberish } from '@ethersproject/bignumber';

export const itemsAPI = (systems: any) => {
  /**
   * @dev burn items from the player's inventory
   *
   * @param indices array of item indices
   * @param amts array of amounts to burn
   */
  const burn = (indices: BigNumberish[], amts: BigNumberish[]) => {
    return systems['system.item.burn'].executeTyped(indices, amts);
  };

  /**
   * @dev craft an item from a recipe
   *
   * @param recipeIndex index of the recipe
   * @param amount amount of the recipe to craft
   */
  const craft = (recipeIndex: number, amount: number) => {
    return systems['system.craft'].executeTyped(recipeIndex, amount);
  };

  /**
   * @dev use an item from the player's inventory
   *
   * @param itemIndex index of the item to use
   * @param amt amount of the item to use
   */
  const use = (itemIndex: number, amt: number) => {
    return systems['system.account.use.item'].executeTyped(itemIndex, amt);
  };

  /**
   * @dev transfer and item from the player's inventory to another account
   *
   * @param itemIndex index of the item thats going to be transferred
   * @param amt amount of the item thats going to be transferred
   * @param accountID index of the account that will receive the item
   */
  const transfer = (itemIndex: number[], amt: number[], accountID: number) => {
    return systems['system.item.transfer'].executeTyped(itemIndex, amt, accountID);
  };

  return {
    burn,
    craft,
    use,
    transfer,
  };
};
