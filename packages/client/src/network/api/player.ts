import { BigNumberish, utils } from 'ethers';

export type PlayerAPI = ReturnType<typeof createPlayerAPI>;

export function createPlayerAPI(systems: any) {
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
  function useFoodPet(kamiID: BigNumberish, itemIndex: number) {
    return systems['system.kami.use.food'].executeTyped(kamiID, itemIndex);
  }

  // revive a pet using a Revive Item
  function useRevivePet(kamiID: BigNumberish, reviveIndex: number) {
    return systems['system.kami.use.revive'].executeTyped(kamiID, reviveIndex);
  }

  function useRenamePotionPet(kamiID: BigNumberish, itemIndex: number) {
    return systems['system.kami.use.renamePotion'].executeTyped(kamiID, itemIndex);
  }

  // upgrade a pet's skill
  function upgradePetSkill(kamiID: BigNumberish, skillIndex: number) {
    return systems['system.Pet.Skill.Upgrade'].executeTyped(kamiID, skillIndex);
  }

  // use a pet item
  function usePetItem(kamiID: BigNumberish, itemIndex: BigNumberish) {
    return systems['system.kami.use.renamePotion'].executeTyped(kamiID, itemIndex);
  }

  /////////////////
  //   ACCOUNT

  // @dev funds an operator from owner address
  // @param amount   amount to fund
  function fundOperator(amount: string) {
    return systems['system.Account.Fund'].ownerToOperator({
      value: utils.parseEther(amount),
    });
  }

  // @dev refunds an operators balance to owner
  // @param amount   amount to refund
  function refundOwner(amount: string) {
    return systems['system.Account.Fund'].operatorToOwner({
      value: utils.parseEther(amount),
    });
  }

  function useFoodAccount(itemIndex: number) {
    return systems['system.account.use.food'].executeTyped(itemIndex);
  }

  function useTeleportAccount(itemIndex: number) {
    return systems['system.account.use.teleport'].executeTyped(itemIndex);
  }

  // @dev moves the account to another room from their current roomIndex
  // @param roomIndex  destination room roomIndex
  function moveAccount(roomIndex: number) {
    return systems['system.Account.Move'].executeTyped(roomIndex);
  }

  // @dev registers an account. should be called by Owner wallet
  // @param operatorAddress   address of the Operator wallet
  // @param name              name of the account
  // @param food              player's reported favorite food
  function registerAccount(operatorAddress: BigNumberish, name: string) {
    return systems['system.Account.Register'].executeTyped(operatorAddress, name);
  }

  // @dev renames account. should be called by Owner EOA
  // @param name       name
  function setAccountName(name: string) {
    return systems['system.Account.Set.Name'].executeTyped(name);
  }

  // @dev sets the Operator address on an account. should be called by Owner EOA
  // @param operatorAddress   address of the Operator wallet
  function setAccountOperator(operatorAddress: BigNumberish) {
    return systems['system.Account.Set.Operator'].executeTyped(operatorAddress);
  }

  // @dev set the Farcaster-associated data for an account
  function setAccountFarcasterData(fid: number, imageURI: string) {
    return systems['system.Account.Set.FarcasterData'].executeTyped(fid, imageURI);
  }

  function upgradeAccountSkill(skillIndex: number) {
    return systems['system.Account.Skill.Upgrade'].executeTyped(skillIndex);
  }

  /////////////////
  // CRAFTING

  function craft(assignerID: BigNumberish, recipeIndex: number, amount: number) {
    return systems['system.craft'].executeTyped(assignerID, recipeIndex, amount);
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
    return systems['system.Friend.Request'].executeTyped(targetAddr);
  }

  // @dev accept a friend request
  // @param reqID entityID of the friend request
  function acceptFriendRequest(reqID: BigNumberish) {
    return systems['system.Friend.Accept'].executeTyped(reqID);
  }

  // @dev cancel a friend request, an existing friend, or a block
  // @param entityID entityID of the friendship entity
  function cancelFriendship(entityID: BigNumberish) {
    return systems['system.Friend.Cancel'].executeTyped(entityID);
  }

  // @dev block an account
  // @param targetAddr owner address of the target account
  function blockAccount(targetAddr: string) {
    return systems['system.Friend.Block'].executeTyped(targetAddr);
  }

  /////////////////
  //  GOALS

  // @dev contributes to a goal
  function goalContribute(goalIndex: number, amt: number) {
    return systems['system.Goal.Contribute'].executeTyped(goalIndex, amt);
  }

  // @dev claims a reward from a goal
  function goalClaim(goalIndex: number) {
    return systems['system.Goal.Claim'].executeTyped(goalIndex);
  }

  /////////////////
  //   LISTINGS

  // @dev allows a character to buy an item through a merchant listing entity
  // @param merchantIndex    entity ID of merchant
  // @param itemIndices      array of item indices
  // @param amt              amount to buy
  function buyFromListing(merchantIndex: number, itemIndices: number[], amts: number[]) {
    return systems['system.Listing.Buy'].executeTyped(merchantIndex, itemIndices, amts);
  }

  // @dev allows a character to sell an item through a merchant listing entity
  // @param merchantIndex    entity ID of merchant
  // @param itemIndices      array of item indices
  // @param amt              amount to sell
  function sellToListing(merchantIndex: number, itemIndices: number[], amts: number[]) {
    return systems['system.Listing.Sell'].executeTyped(merchantIndex, itemIndices, amts);
  }

  /////////////////
  //   LOOTBOX

  // @dev starts a lootbox reveal (commit)
  // @param index   item index of lootbox
  // @param amount  amount of lootboxes to open
  function lootboxCommit(index: number, amount: number) {
    return systems['system.Lootbox.Commit'].executeTyped(index, amount);
  }

  /////////////////
  //   NODES

  // @dev collects from all eligible productions on a node
  // @param nodeID   entityID of the node
  function collectAllFromNode(nodeID: BigNumberish) {
    return systems['system.Node.Collect'].executeTyped(nodeID);
  }

  /////////////////
  // PRODUCTIONS

  // @dev retrieves the amount due from a passive deposit production and resets the starting point
  function collectProduction(productionID: BigNumberish) {
    return systems['system.Production.Collect'].executeTyped(productionID);
  }

  // @dev liquidates a production, if able to, using the specified pet
  function liquidateProduction(productionID: BigNumberish, kamiID: BigNumberish) {
    return systems['system.Production.Liquidate'].executeTyped(productionID, kamiID);
  }

  // @dev starts a deposit production for a character. If none exists, it creates one.
  function startProduction(kamiID: BigNumberish, nodeID: BigNumberish) {
    return systems['system.Production.Start'].executeTyped(kamiID, nodeID);
  }

  // @dev retrieves the amount due from a passive deposit production and stops it.
  function stopProduction(productionID: BigNumberish) {
    return systems['system.Production.Stop'].executeTyped(productionID);
  }

  /////////////////
  //   QUESTS

  // @dev accept a quest for an account
  // @param index   index of the quest
  function acceptQuest(assignerID: BigNumberish, index: number) {
    return systems['system.Quest.Accept'].executeTyped(assignerID, index);
  }

  // @dev complete a quest for an account
  // @param id   id of the quest
  function completeQuest(id: BigNumberish) {
    return systems['system.Quest.Complete'].executeTyped(id);
  }

  /////////////////
  //  SKILLS

  function upgradeSkill(entityID: BigNumberish, skillIndex: number) {
    return systems['system.Skill.Upgrade'].executeTyped(entityID, skillIndex);
  }

  /////////////////
  // RELATIONSHIP

  function advanceRelationship(indexNPC: number, indexRelationship: number) {
    return systems['system.Relationship.Advance'].executeTyped(indexNPC, indexRelationship);
  }

  /////////////////
  //   SCAVENGE

  // @dev claim scavenge points
  function claimScavenge(scavBarID: BigNumberish) {
    return systems['system.Scavenge.Claim'].executeTyped(scavBarID);
  }

  /////////////////
  //    MINT

  // @dev mint a pet with a gacha ticket
  // @param amount  number of pets to mint
  function mintPet(amount: BigNumberish) {
    return systems['system.kami.gacha.Mint'].executeTyped(amount);
  }

  // @dev reveal a minted pet
  // @param commitIDs array of commitIDs
  function revealPet(commitIDs: BigNumberish[]) {
    return systems['system.kami.gacha.Reveal'].reveal(commitIDs);
  }

  // @dev reroll a pet
  // @param kamiID  kamiID
  function rerollPet(kamiIDs: BigNumberish[], totalCost: BigNumberish) {
    return systems['system.kami.gacha.Reroll'].reroll(kamiIDs, {
      value: totalCost,
    });
  }

  /////////////////
  //   ERC721

  // @dev deposits pet from outside -> game world
  // @param tokenID  ERC721 kamiID, not MUD entity ID
  function depositERC721(tokenID: BigNumberish) {
    return systems['system.Kami721.Stake'].executeTyped(tokenID);
  }

  // @dev brings pet from game world -> outside
  // @param tokenID  ERC721 kamiID, not MUD entity ID
  function withdrawERC721(tokenID: BigNumberish) {
    return systems['system.Kami721.Unstake'].executeTyped(tokenID);
  }

  return {
    pet: {
      level: levelPet,
      name: namePet,
      skill: { upgrade: upgradePetSkill },
      use: {
        food: useFoodPet,
        renamePotion: useRenamePotionPet,
        revive: useRevivePet,
      },
    },
    account: {
      consume: useFoodAccount,
      fund: fundOperator,
      move: moveAccount,
      register: registerAccount,
      refund: refundOwner,
      set: {
        farcaster: setAccountFarcasterData,
        name: setAccountName,
        operator: setAccountOperator,
      },
      skill: { upgrade: upgradeAccountSkill },
      use: {
        food: useFoodAccount,
        teleport: useTeleportAccount,
      },
    },
    crafting: { craft },
    social: {
      friend: {
        accept: acceptFriendRequest,
        block: blockAccount,
        cancel: cancelFriendship,
        request: sendFriendRequest,
      },
    },
    droptable: {
      reveal: droptableReveal,
    },
    item: {
      burn: burnItems,
      lootbox: {
        commit: lootboxCommit,
      },
    },
    goal: {
      contribute: goalContribute,
      claim: goalClaim,
    },
    listing: {
      buy: buyFromListing,
      sell: sellToListing,
    },
    node: {
      collect: collectAllFromNode,
    },
    mint: {
      mintPet: mintPet,
      reveal: revealPet,
      reroll: rerollPet,
    },
    production: {
      collect: collectProduction,
      liquidate: liquidateProduction,
      start: startProduction,
      stop: stopProduction,
    },
    quests: {
      accept: acceptQuest,
      complete: completeQuest,
    },
    scavenge: {
      claim: claimScavenge,
    },
    skill: {
      upgrade: upgradeSkill,
    },
    relationship: {
      advance: advanceRelationship,
    },
    ERC721: {
      deposit: depositERC721,
      withdraw: withdrawERC721,
    },
  };
}
