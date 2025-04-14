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

  return {
    burn,
    craft,
    use,
  };
};
