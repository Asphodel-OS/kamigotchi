import { BigNumberish } from 'ethers';

import { chatAPI } from './chat';
import { friendsAPI } from './friends';
import { itemsAPI } from './items';
import { questsAPI } from './quests';
import { settingsAPI } from './settings';
import { tradesAPI } from './trades';

/**
 * @dev A player is an account on the KamiGotchi ecosystem.
 * They can own and trade Kami, and interact with other players.
 */
export function accountsAPI(systems: any) {
  /**
   * @dev (Owner) register an account
   *
   * @param operatorAddress address of the Operator wallet
   * @param name requested name of the account
   */
  const register = (operatorAddress: BigNumberish, name: string) => {
    return systems['system.account.register'].executeTyped(operatorAddress, name);
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
  // ITEMS

  return {
    move,
    register,
    chat: chatAPI(systems),
    friend: friendsAPI(systems),
    item: itemsAPI(systems),
    quest: questsAPI(systems),
    set: settingsAPI(systems),
    trade: tradesAPI(systems),
  };
}
