import { TxQueue } from 'engine/queue';
import { BigNumberish } from 'ethers';
import { auctionsAPI } from './auctions';
import { externalAPI } from './external';
import { harvestAPI } from './harvest';

export type PlayerAPI = ReturnType<typeof createPlayerAPI>;

export function createPlayerAPI(txQueue: TxQueue) {
  const { call, systems } = txQueue;

  /////////////////
  // ECHO

  function echoKamis() {
    return systems['system.echo.kamis'].executeTyped();
  }

  function echoRoom() {
    return systems['system.echo.room'].executeTyped();
  }

  /////////////////
  //     KAMI

  // level a pet, if it has enough experience
  function levelPet(kamiID: BigNumberish) {
    return systems['system.kami.level'].executeTyped(kamiID);
  }

  // name / rename a pet
  function namePet(kamiID: BigNumberish, name: string) {
    return systems['system.kami.name'].executeTyped(kamiID, name);
  }

  // feed a pet using a Pet Item
  function useItemPet(kamiID: BigNumberish, itemIndex: number) {
    return systems['system.kami.use.item'].executeTyped(kamiID, itemIndex);
  }

  /////////////////
  //   ACCOUNT

  function useItemAccount(itemIndex: number, amt: number) {
    return systems['system.account.use.item'].executeTyped(itemIndex, amt);
  }

  function moveAccount(roomIndex: number) {
    // hardcode gas limit to 1.2m; approx upper bound for moving room with 1 gate
    return systems['system.account.move'].executeTyped(roomIndex); //, { gasLimit: 1200000 });
  }

  // @dev registers an account. should be called by Owner wallet
  // @param operatorAddress   address of the Operator wallet
  // @param name              name of the account
  // @param food              player's reported favorite food
  function registerAccount(operatorAddress: BigNumberish, name: string) {
    return systems['system.account.register'].executeTyped(operatorAddress, name);
  }

  function setAccountPFP(kamiID: BigNumberish) {
    return systems['system.account.set.pfp'].executeTyped(kamiID);
  }

  // @dev renames account. should be called by Owner EOA
  // @param name       name
  function setAccountName(name: string) {
    return systems['system.account.set.name'].executeTyped(name);
  }

  // @dev sets the Operator address on an account. should be called by Owner EOA
  // @param operatorAddress   address of the Operator wallet
  function setAccountOperator(operatorAddress: BigNumberish) {
    return systems['system.account.set.operator'].executeTyped(operatorAddress);
  }

  /////////////////
  // CHAT
  function sendMessage(message: string) {
    return systems['system.chat'].executeTyped(message);
  }

  /////////////////
  // CRAFTING

  function craft(recipeIndex: number, amount: number) {
    return systems['system.craft'].executeTyped(recipeIndex, amount);
  }

  ////////////////
  // DROPTABLES

  function droptableReveal(ids: BigNumberish[]) {
    return systems['system.droptable.item.reveal'].executeTyped(ids);
  }

  ////////////////
  // ITEMS

  function burnItems(indices: BigNumberish[], amts: BigNumberish[]) {
    return systems['system.item.burn'].executeTyped(indices, amts);
  }

  /////////////////
  //  FRIENDS

  // @dev send a friend request
  // @param targetAddr owner address of the target account
  function sendFriendRequest(targetAddr: string) {
    return systems['system.friend.request'].executeTyped(targetAddr);
  }

  // @dev accept a friend request
  // @param reqID entityID of the friend request
  function acceptFriendRequest(reqID: BigNumberish) {
    return systems['system.friend.accept'].executeTyped(reqID);
  }

  // @dev cancel a friend request, an existing friend, or a block
  // @param entityID entityID of the friendship entity
  function cancelFriendship(entityID: BigNumberish) {
    return systems['system.friend.cancel'].executeTyped(entityID);
  }

  // @dev block an account
  // @param targetAddr owner address of the target account
  function blockAccount(targetAddr: string) {
    return systems['system.friend.block'].executeTyped(targetAddr);
  }

  /////////////////
  //  GOALS

  // @dev contributes to a goal
  function goalContribute(goalIndex: number, amt: number) {
    return systems['system.goal.contribute'].executeTyped(goalIndex, amt);
  }

  // @dev claims a reward from a goal
  function goalClaim(goalIndex: number) {
    return systems['system.goal.claim'].executeTyped(goalIndex);
  }

  /////////////////
  //   LISTINGS

  // @dev allows a character to buy an item through a merchant listing entity
  // @param merchantIndex    entity ID of merchant
  // @param itemIndices      array of item indices
  // @param amt              amount to buy
  function buyFromListing(merchantIndex: number, itemIndices: number[], amts: number[]) {
    return systems['system.listing.buy'].executeTyped(merchantIndex, itemIndices, amts);
  }

  // @dev allows a character to sell an item through a merchant listing entity
  // @param merchantIndex    entity ID of merchant
  // @param itemIndices      array of item indices
  // @param amt              amount to sell
  function sellToListing(merchantIndex: number, itemIndices: number[], amts: number[]) {
    return systems['system.listing.sell'].executeTyped(merchantIndex, itemIndices, amts);
  }

  /////////////////
  //   QUESTS

  // @dev accept a quest for an account
  // @param index   index of the quest
  function acceptQuest(index: number) {
    return systems['system.quest.accept'].executeTyped(index);
  }

  // @dev complete a quest for an account
  // @param id   id of the quest
  function completeQuest(id: BigNumberish) {
    return systems['system.quest.complete'].executeTyped(id);
  }

  /////////////////
  //  SKILLS

  function upgradeSkill(entityID: BigNumberish, skillIndex: number) {
    return systems['system.skill.upgrade'].executeTyped(entityID, skillIndex);
  }

  function resetSkill(entityID: BigNumberish) {
    return systems['system.skill.reset'].executeTyped(entityID);
  }

  /////////////////
  // RELATIONSHIP

  function advanceRelationship(indexNPC: number, indexRelationship: number) {
    return systems['system.relationship.advance'].executeTyped(indexNPC, indexRelationship);
  }

  /////////////////
  //   SCAVENGE

  // @dev claim scavenge points
  function claimScavenge(scavBarID: BigNumberish) {
    return systems['system.scavenge.claim'].executeTyped(scavBarID);
  }

  /////////////////
  //   TRADE

  function createTrade(
    buyIndices: Number[],
    buyAmts: BigNumberish[],
    sellIndices: Number[],
    sellAmts: BigNumberish[],
    targetID: BigNumberish
  ) {
    return systems['system.trade.create'].executeTyped(
      buyIndices,
      buyAmts,
      sellIndices,
      sellAmts,
      targetID
    );
  }

  function executeTrade(tradeID: BigNumberish) {
    return systems['system.trade.execute'].executeTyped(tradeID);
  }

  function cancelTrade(tradeID: BigNumberish) {
    return systems['system.trade.cancel'].executeTyped(tradeID);
  }
  /////////////////
  //    MINT

  // @dev mint a pet with a gacha ticket
  // @param amount  number of pets to mint
  function mintPet(amount: BigNumberish) {
    return systems['system.kami.gacha.mint'].executeTyped(amount);
  }

  // @dev reveal a minted pet
  // @param commitIDs array of commitIDs
  function revealPet(commitIDs: BigNumberish[]) {
    return systems['system.kami.gacha.reveal'].reveal(commitIDs);
  }

  // @dev reroll a pet
  // @param kamiID  kamiID
  function rerollPet(kamiIDs: BigNumberish[], totalCost: BigNumberish) {
    return systems['system.kami.gacha.reroll'].reroll(kamiIDs, {
      value: totalCost,
    });
  }

  /////////////////
  //   ERC721

  // @dev deposits pet from outside -> game world
  // @param tokenID  ERC721 kamiID, not MUD entity ID
  function depositERC721(tokenID: BigNumberish) {
    return systems['system.kami721.stake'].executeTyped(tokenID);
  }

  // @dev brings pet from game world -> outside
  // @param tokenID  ERC721 kamiID, not MUD entity ID
  function withdrawERC721(tokenID: BigNumberish) {
    return systems['system.kami721.unstake'].executeTyped(tokenID);
  }

  return {
    ...externalAPI(call),
    echo: {
      kami: echoKamis,
      room: echoRoom,
    },
    pet: {
      level: levelPet,
      name: namePet,
      use: { item: useItemPet },
    },
    account: {
      move: moveAccount,
      register: registerAccount,
      set: {
        name: setAccountName,
        operator: setAccountOperator,
        pfp: setAccountPFP,
      },
      use: {
        item: useItemAccount,
      },
    },
    auction: auctionsAPI(systems),
    crafting: { craft },
    social: {
      friend: {
        accept: acceptFriendRequest,
        block: blockAccount,
        cancel: cancelFriendship,
        request: sendFriendRequest,
      },
      chat: {
        send: sendMessage,
      },
    },
    droptable: {
      reveal: droptableReveal,
    },
    item: {
      burn: burnItems,
    },
    goal: {
      contribute: goalContribute,
      claim: goalClaim,
    },
    listing: {
      buy: buyFromListing,
      sell: sellToListing,
    },
    mint: {
      mintPet: mintPet,
      reveal: revealPet,
      reroll: rerollPet,
    },
    harvest: harvestAPI(systems),
    quests: {
      accept: acceptQuest,
      complete: completeQuest,
    },
    scavenge: {
      claim: claimScavenge,
    },
    skill: {
      upgrade: upgradeSkill,
      reset: resetSkill,
    },
    relationship: {
      advance: advanceRelationship,
    },
    trade: {
      create: createTrade,
      execute: executeTrade,
      cancel: cancelTrade,
    },
    ERC721: {
      deposit: depositERC721,
      withdraw: withdrawERC721,
    },
  };
}
