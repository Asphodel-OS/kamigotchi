import { BigNumberish } from "ethers";

export function createPlayerAPI(systems: any) {
  /*********************
   *       Pet 
   *********************/

  // feed a pet using a Pet Item
  function feedPet(petID: BigNumberish, foodIndex: number) {
    return systems["system.Pet.Feed"].executeTyped(petID, foodIndex);
  }

  // name / rename a pet
  function namePet(petID: BigNumberish, name: string) {
    return systems["system.Pet.Name"].executeTyped(petID, name);
  }

  // revive a pet using a Revive Item
  function revivePet(petID: BigNumberish, reviveIndex: number) {
    return systems["system.Pet.Revive"].executeTyped(petID, reviveIndex);
  }

  /*********************
   *     Account
   *********************/
  // @dev moves the account to another room from their current location
  // @param location  destination room location
  function moveAccount(location: number) {
    return systems["system.Account.Move"].executeTyped(location);
  }

  // @dev registers an account. should be called by Owner wallet
  // @param operatorAddress   address of the Operator wallet
  // @param name              name of the account
  function registerAccount(operatorAddress: BigNumberish, name: string) {
    return systems["system.Account.Register"].executeTyped(operatorAddress, name);
  }

  // @dev renames account. should be called by Owner EOA
  // @param name       name
  function setAccountName(name: string) {
    return systems["system.Account.Set.Name"].executeTyped(name);
  }

  // @dev sets the Operator address on an account. should be called by Owner EOA
  // @param operatorAddress   address of the Operator wallet
  function setAccountOperator(operatorAddress: BigNumberish) {
    return systems["system.Account.Set.Operator"].executeTyped(operatorAddress);
  }

  /*********************
   *     Listings
   *********************/

  // @dev allows a character to buy an item through a merchant listing entity
  // @param listingID    entity ID of listing
  // @param amt          amount to buy
  function buyFromListing(listingID: BigNumberish, amt: number) {
    return systems["system.Listing.Buy"].executeTyped(listingID, amt);
  }

  // @dev allows a character to sell an item through a merchant listing entity
  // @param listingID    entity ID of listing
  // @param amt          amount to sell
  function sellToListing(listingID: BigNumberish, amt: number) {
    return systems["system.Listing.Sell"].executeTyped(listingID, amt);
  }

  /*********************
   *      NODES
   *********************/

  // @dev collects from all eligible productions on a node
  // @param nodeID   entityID of the node
  function collectAllFromNode(nodeID: BigNumberish) {
    return systems["system.Node.Collect"].executeTyped(nodeID);
  }

  /*********************
   *    PRODUCTIONS 
   *********************/

  // @dev retrieves the amount due from a passive deposit production and resets the starting point
  function collectProduction(productionID: BigNumberish) {
    return systems["system.Production.Collect"].executeTyped(productionID);
  }

  // @dev liquidates a production, if able to, using the specified pet
  function liquidateProduction(productionID: BigNumberish, petID: BigNumberish) {
    return systems["system.Production.Liquidate"].executeTyped(productionID, petID);
  }

  // @dev starts a deposit production for a character. If none exists, it creates one.
  function startProduction(petID: BigNumberish, nodeID: BigNumberish) {
    return systems["system.Production.Start"].executeTyped(petID, nodeID);
  }

  // @dev retrieves the amount due from a passive deposit production and stops it.
  function stopProduction(productionID: BigNumberish) {
    return systems["system.Production.Stop"].executeTyped(productionID);
  }


  /*********************
   *       TRADE
   *********************/

  // @dev Updates Trade to ACCEPTED, removes IsRequest Component, creates ACTIVE Registers
  // @param tradeID   entityID of the trade log
  function acceptTrade(tradeID: BigNumberish) {
    return systems["system.Trade.Accept"].executeTyped(tradeID);
  }

  // @dev creates an itemInventory entity, assigns to trade register and transfers the
  // item balance specified amount of the item from the account to trade register
  // @param tradeID   entityID of the trade log
  // @param itemType  the id of the item being added, 0 for merit
  // @param amt       quantity of item being added
  function addToTrade(tradeID: BigNumberish, itemType: number, amt: number) {
    return systems["system.Trade.AddTo"].executeTyped(tradeID, itemType, amt);
  }

  // @dev Updates Trade to CANCELED, updates both Registers ACTIVE->CANCELED
  // @param tradeID entityID of the trade log
  function cancelTrade(tradeID: BigNumberish) {
    return systems["system.Trade.Cancel"].executeTyped(tradeID);
  }

  // @dev Updates Trade ACCEPTED->?COMPLETE, updates account's register ACTIVE->CONFIRMED
  // @param tradeID   entityID of the trade log
  function confirmTrade(tradeID: BigNumberish) {
    return systems["system.Trade.Confirm"].executeTyped(tradeID);
  }

  // @dev Creates an INITIATED Trade between Account and toID, with IsRequest Component
  // @param toID  entityID of the trade request receiver
  function initiateTrade(toID: BigNumberish) {
    return systems["system.Trade.Initiate"].executeTyped(toID);
  }


  /*********************
  *       ERC721
  *********************/

  // mint a pet
  function mintPet(address: BigNumberish, amount: BigNumberish) {
    return systems["system.ERC721.Mint"].executeTyped(address, amount);
  }

  // reveal a minted pet
  // @param tokenID  ERC721 petID, not MUD entity ID
  function revealPet(tokenID: BigNumberish) {
    return systems["system.ERC721.metadata"].executeTyped(tokenID);
  }

  // @dev deposits pet from outside -> game world
  // @param tokenID  ERC721 petID, not MUD entity ID
  function depositERC721(tokenID: BigNumberish) {
    return systems["system.ERC721.Stake"].executeTyped(tokenID);
  }

  // @dev brings pet from game world -> outside
  // @param tokenID  ERC721 petID, not MUD entity ID
  function withdrawERC721(tokenID: BigNumberish) {
    return systems["system.ERC721.Unstake"].executeTyped(tokenID);
  }

  /*********************
  *       ERC20
  *********************/

  // @dev bridges ERC20 tokens from outside -> game world
  // @param amount  amount of ERC20 tokens to bridge
  function depositERC20(amount: BigNumberish) {
    return systems["system.ERC20.Deposit"].executeTyped(amount);
  }

  // @dev bridges ERC20 tokens from game world -> outside
  // @param amount  amount of ERC20 tokens to bridge
  function withdrawERC20(amount: BigNumberish) {
    return systems["system.ERC20.Withdraw"].executeTyped(amount);
  }

  return {
    pet: {
      feed: feedPet,
      name: namePet,
      revive: revivePet,
    },
    account: {
      move: moveAccount,
      register: registerAccount,
      set: {
        name: setAccountName,
        operator: setAccountOperator,
      },
    },
    listing: {
      buy: buyFromListing,
      sell: sellToListing,
    },
    node: {
      collect: collectAllFromNode,
    },
    production: {
      collect: collectProduction,
      liquidate: liquidateProduction,
      start: startProduction,
      stop: stopProduction,
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
      mint: mintPet,
      reveal: revealPet,
      withdraw: withdrawERC721,
    },
    ERC20: {
      deposit: depositERC20,
      withdraw: withdrawERC20,
    },
  };
}
