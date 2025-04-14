import { BigNumberish } from '@ethersproject/bignumber';

/**
 * @dev A player is an account on the KamiGotchi ecosystem.
 * They can own and trade Kami, and interact with other players.
 */
export function accountsAPI(systems: any) {
  /////////////////
  // ACCOUNT MODIFICATIONS

  /**
   * @dev (Owner) register an account
   *
   * @param operatorAddress address of the Operator wallet
   * @param name requested name of the account
   */
  const register = (operatorAddress: BigNumberish, name: string) => {
    return systems['system.account.register'].executeTyped(operatorAddress, name);
  };

  /**
   * @dev (Owner) set the Account's profile picture to that of an owned Kami
   *
   * @param kamiID entityID of the Kami
   */
  const setPFP = (kamiID: BigNumberish) => {
    return systems['system.account.set.pfp'].executeTyped(kamiID);
  };

  /**
   * @dev (Owner) rename the account
   *
   * @param name new name
   */
  const setName = (name: string) => {
    return systems['system.account.set.name'].executeTyped(name);
  };

  /**
   * @dev (Owner) set the Operator address on an account
   *
   * @param operatorAddress Operator EOA to update to
   */
  const setOperator = (operatorAddress: BigNumberish) => {
    return systems['system.account.set.operator'].executeTyped(operatorAddress);
  };

  /////////////////
  // ACTIONS

  /**
   * @dev move the Account to a new room
   *
   * @param roomIndex index of the room to move to
   */
  const move = (roomIndex: number) => {
    // hardcode gas limit to 1.2m; approx upper bound for moving room with 1 gate
    return systems['system.account.move'].executeTyped(roomIndex, { gasLimit: 1200000 });
  };

  /////////////////
  // CHAT

  /**
   * @dev send a chat message in the current room
   * @param message message to send
   */
  const sendMessage = (message: string) => {
    return systems['system.chat'].executeTyped(message);
  };

  /////////////////
  // FRIENDS

  /**
   * @dev send a friend request
   * @param targetAddr owner address of the target account
   */
  const requestFriend = (targetAddr: string) => {
    return systems['system.friend.request'].executeTyped(targetAddr);
  };

  /**
   * @dev accept a friend request
   * @param requestID entityID of the friend request
   */
  const acceptFriend = (requestID: BigNumberish) => {
    return systems['system.friend.accept'].executeTyped(requestID);
  };

  /**
   * @dev cancel a friend request, an existing friend, or a block
   * @param entityID entityID of the friendship entity
   */
  const cancelFriend = (entityID: BigNumberish) => {
    return systems['system.friend.cancel'].executeTyped(entityID);
  };

  /**
   * @dev block an account
   * @param targetAddr owner address of the target account
   */
  const blockFriend = (targetAddr: string) => {
    return systems['system.friend.block'].executeTyped(targetAddr);
  };

  /////////////////
  // ITEMS

  /**
   * @dev burn items from the player's inventory
   *
   * @param indices array of item indices
   * @param amts array of amounts to burn
   */
  const burnItems = (indices: BigNumberish[], amts: BigNumberish[]) => {
    return systems['system.item.burn'].executeTyped(indices, amts);
  };

  /**
   * @dev craft an item from a recipe
   *
   * @param recipeIndex index of the recipe
   * @param amount amount of the recipe to craft
   */
  const craftItems = (recipeIndex: number, amount: number) => {
    return systems['system.craft'].executeTyped(recipeIndex, amount);
  };

  /**
   * @dev use an item from the player's inventory
   *
   * @param itemIndex index of the item to use
   * @param amt amount of the item to use
   */
  const useItems = (itemIndex: number, amt: number) => {
    return systems['system.account.use.item'].executeTyped(itemIndex, amt);
  };

  /*******************
   *  TRADES
   *
   * @dev A trade is a transaction between two accounts.
   * It can be used to buy or sell items. with other players.
   */

  /**
   * @dev create a trade.
   *
   * @param buyIndices indices of items to buy
   * @param buyAmts amounts of items to buy
   * @param sellIndices indices of items to sell
   * @param sellAmts amounts of items to sell
   * @param targetID entityID of the target account
   */
  const createTrade = (
    buyIndices: Number[],
    buyAmts: BigNumberish[],
    sellIndices: Number[],
    sellAmts: BigNumberish[],
    targetID: BigNumberish
  ) => {
    return systems['system.trade.create'].executeTyped(
      buyIndices,
      buyAmts,
      sellIndices,
      sellAmts,
      targetID
    );
  };

  /**
   * @dev execute a trade. A trade is a transaction between two accounts.
   * It can be used to buy or sell items. with other players.
   *
   * @param tradeID entityID of the trade
   */
  const executeTrade = (tradeID: BigNumberish) => {
    return systems['system.trade.execute'].executeTyped(tradeID);
  };

  /**
   * @dev cancel a trade. A trade is a transaction between two accounts.
   * It can be used to buy or sell items. with other players.
   *
   * @param tradeID entityID of the trade
   */
  const cancelTrade = (tradeID: BigNumberish) => {
    return systems['system.trade.cancel'].executeTyped(tradeID);
  };

  return {
    move,
    register,
    chat: {
      send: sendMessage,
    },
    friend: {
      accept: acceptFriend,
      block: blockFriend,
      cancel: cancelFriend,
      request: requestFriend,
    },
    item: {
      burn: burnItems,
      craft: craftItems,
      use: useItems,
    },
    set: {
      name: setName,
      operator: setOperator,
      pfp: setPFP,
    },
    trade: {
      create: createTrade,
      execute: executeTrade,
      cancel: cancelTrade,
    },
  };
}
