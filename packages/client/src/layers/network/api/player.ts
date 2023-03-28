import { BigNumberish } from "ethers";

export function createPlayerAPI(systems: any) {
  /*********************
   *    Pet ERC721
   *********************/

  // @dev feeds pet
  // @param petID
  // @param food index (of registry entry)
  function feedPet(petID: BigNumberish, food: number) {
    return systems["system.Pet.Feed"].executeTyped(petID, food);
  }

  // @dev 
  // @param address   address to mint to
  function mintPet(address: BigNumberish) {
    return systems["system.ERC721.pet"].mint(address);
  }

  // @dev
  // @param entityID   pet entity
  // @param name       name
  function namePet(petID: BigNumberish, name: string) {
    return systems["system.Pet.Name"].executeTyped(petID, name);
  }

  // @dev commit reveal 
  // @param tokenID   ERC721 petID, not MUD
  function revealPet(tokenID: BigNumberish) {
    return systems["system.ERC721.metadata"].executeTyped(tokenID);
  }

  /*********************
   *     Account
   *********************/
  // @dev moves the account to another room from their current location
  // @param location  destination room location
  function moveAccount(location: number) {
    return systems["system.Account.Move"].executeTyped(location);
  }

  // @dev   renames account, ignoring previous name
  // @param entityID   pet entity
  // @param name       name
  function nameAccount(account: BigNumberish, name: string) {
    return systems["system.Account.Name"].executeTyped(account, name);
  }

  // @dev sets the account of an Owner wallet. should be set by Owner wallet
  // @param account  address of the account wallet
  // @param name      name of the account
  function setAccount(account: BigNumberish, name: string) {
    return systems["system.Account.Set"].executeTyped(account, name);
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
  *       TRADE
  *********************/



  return {
    ERC721: {
      mint: mintPet,
      reveal: revealPet,
      name: namePet,
    },
    listing: {
      buy: buyFromListing,
      sell: sellToListing,
    },
    account: {
      move: moveAccount,
      name: nameAccount,
      set: setAccount,
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
    food: {
      feed: feedPet,
    }
  };
}
