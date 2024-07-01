import { BigNumberish, utils } from 'ethers';

export type PlayerAPI = ReturnType<typeof createPlayerAPI>;

export function createPlayerAPI(systems: any) {
  /////////////////
  //     PET

  // feed a pet using a Pet Item
  function feedPet(petID: BigNumberish, itemIndex: number) {
    return systems['system.Pet.Feed'].executeTyped(petID, itemIndex);
  }

  // level a pet, if it has enough experience
  function levelPet(petID: BigNumberish) {
    return systems['system.Pet.Level'].executeTyped(petID);
  }

  // name / rename a pet
  function namePet(petID: BigNumberish, name: string) {
    return systems['system.Pet.Name'].executeTyped(petID, name);
  }

  // revive a pet using a Revive Item
  function revivePet(petID: BigNumberish, reviveIndex: number) {
    return systems['system.Pet.Revive'].executeTyped(petID, reviveIndex);
  }

  // upgrade a pet's skill
  function upgradePetSkill(petID: BigNumberish, skillIndex: number) {
    return systems['system.Pet.Skill.Upgrade'].executeTyped(petID, skillIndex);
  }

  // use a pet item
  function usePetItem(petID: BigNumberish, itemIndex: BigNumberish) {
    return systems['system.Pet.Use.Item'].executeTyped(petID, itemIndex);
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
  function lootboxStartReveal(index: number, amount: number) {
    return systems['system.Lootbox.Reveal.Start'].executeTyped(index, amount);
  }

  // @dev executes a lootbox reveal (reveal)
  // @param id    entityID of reveal entity
  function lootboxExecuteReveal(id: BigNumberish) {
    return systems['system.Lootbox.Reveal.Execute'].executeTyped(id);
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
  function liquidateProduction(productionID: BigNumberish, petID: BigNumberish) {
    return systems['system.Production.Liquidate'].executeTyped(productionID, petID);
  }

  // @dev starts a deposit production for a character. If none exists, it creates one.
  function startProduction(petID: BigNumberish, nodeID: BigNumberish) {
    return systems['system.Production.Start'].executeTyped(petID, nodeID);
  }

  // @dev retrieves the amount due from a passive deposit production and stops it.
  function stopProduction(productionID: BigNumberish) {
    return systems['system.Production.Stop'].executeTyped(productionID);
  }

  /////////////////
  //   QUESTS

  // @dev accept a quest for an account
  // @param index   index of the quest
  function acceptQuest(index: number) {
    return systems['system.Quest.Accept'].executeTyped(index);
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
  //   TRADE

  // @dev Updates Trade to ACCEPTED, removes IsRequest Component, creates ACTIVE Registers
  // @param tradeID   entityID of the trade log
  function acceptTrade(tradeID: BigNumberish) {
    return systems['system.Trade.Accept'].executeTyped(tradeID);
  }

  // @dev creates an itemInventory entity, assigns to trade register and transfers the
  // item balance specified amount of the item from the account to trade register
  // @param tradeID   entityID of the trade log
  // @param itemType  the id of the item being added, 0 for merit
  // @param amt       quantity of item being added
  function addToTrade(tradeID: BigNumberish, itemType: number, amt: number) {
    return systems['system.Trade.AddTo'].executeTyped(tradeID, itemType, amt);
  }

  // @dev Updates Trade to CANCELED, updates both Registers ACTIVE->CANCELED
  // @param tradeID entityID of the trade log
  function cancelTrade(tradeID: BigNumberish) {
    return systems['system.Trade.Cancel'].executeTyped(tradeID);
  }

  // @dev Updates Trade ACCEPTED->?COMPLETE, updates account's register ACTIVE->CONFIRMED
  // @param tradeID   entityID of the trade log
  function confirmTrade(tradeID: BigNumberish) {
    return systems['system.Trade.Confirm'].executeTyped(tradeID);
  }

  // @dev Creates an INITIATED Trade between Account and toID, with IsRequest Component
  // @param toID  entityID of the trade request receiver
  function initiateTrade(toID: BigNumberish) {
    return systems['system.Trade.Initiate'].executeTyped(toID);
  }

  /////////////////
  //    MINT

  // @dev mint a pet with a mint20 token
  // @param amount  number of pets to mint
  function mintPet(amount: BigNumberish) {
    return systems['system.Pet.Gacha.Mint'].executeTyped(amount);
  }

  // @dev reveal a minted pet
  // @param commitIDs array of commitIDs
  function revealPet(commitIDs: BigNumberish[]) {
    return systems['system.Pet.Gacha.Reveal'].reveal(commitIDs);
  }

  // @dev reroll a pet
  // @param petID  PetID
  function rerollPet(petIDs: BigNumberish[], totalCost: BigNumberish) {
    return systems['system.Pet.Gacha.Reroll'].reroll(petIDs, {
      value: totalCost,
    });
  }

  // @dev mint mint20 tokens with eth
  // @param amount  number of tokens to mint
  // @param cost    cost in ETH
  function mintToken(amount: BigNumberish, cost: BigNumberish) {
    return systems['system.Mint20.Mint'].mint(amount, {
      value: utils.parseEther(cost.toString()),
    });
  }

  /////////////////
  //   ERC721

  // @dev deposits pet from outside -> game world
  // @param tokenID  ERC721 petID, not MUD entity ID
  function depositERC721(tokenID: BigNumberish) {
    return systems['system.Pet721.Stake'].executeTyped(tokenID);
  }

  // @dev brings pet from game world -> outside
  // @param tokenID  ERC721 petID, not MUD entity ID
  function withdrawERC721(tokenID: BigNumberish) {
    return systems['system.Pet721.Unstake'].executeTyped(tokenID);
  }

  /////////////////
  //    ERC20

  // @dev bridges ERC20 tokens from outside -> game world
  // @param amount  amount of ERC20 tokens to bridge
  function depositERC20(amount: BigNumberish) {
    return systems['system.Farm20.Deposit'].executeTyped(amount);
  }

  // @dev bridges ERC20 tokens from game world -> outside
  // @param amount  amount of ERC20 tokens to bridge
  function initWithdrawERC20(amount: BigNumberish) {
    return systems['system.Farm20.Withdraw'].scheduleWithdraw(amount);
  }

  // @dev bridges ERC20 tokens from game world -> outside
  // @param amount  amount of ERC20 tokens to bridge
  function execWithdrawERC20(id: BigNumberish) {
    return systems['system.Farm20.Withdraw'].executeWithdraw(id);
  }

  return {
    pet: {
      feed: feedPet,
      level: levelPet,
      name: namePet,
      revive: revivePet,
      use: usePetItem,
      skill: { upgrade: upgradePetSkill },
    },
    account: {
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
    },
    social: {
      friend: {
        accept: acceptFriendRequest,
        block: blockAccount,
        cancel: cancelFriendship,
        request: sendFriendRequest,
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
    lootbox: {
      startReveal: lootboxStartReveal,
      executeReveal: lootboxExecuteReveal,
    },
    node: {
      collect: collectAllFromNode,
    },
    mint: {
      mintPet: mintPet,
      mintToken: mintToken,
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
    skill: {
      upgrade: upgradeSkill,
    },
    relationship: {
      advance: advanceRelationship,
    },
    trade: {
      accept: acceptTrade,
      addTo: addToTrade,
      cancel: cancelTrade,
      confirm: confirmTrade,
      initiate: initiateTrade,
    },
    ERC721: {
      deposit: depositERC721,
      withdraw: withdrawERC721,
    },
    ERC20: {
      deposit: depositERC20,
      withdraw: {
        start: initWithdrawERC20,
        execute: execWithdrawERC20,
      },
    },
  };
}
