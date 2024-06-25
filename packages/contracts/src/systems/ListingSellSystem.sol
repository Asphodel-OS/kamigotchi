// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibNPC } from "libraries/LibNPC.sol";

uint256 constant ID = uint256(keccak256("system.Listing.Sell"));

// ListingSellSystem allows a character to buy an item listed with a merchant (npc)
// NOTE: this currently assumes all purchases are for fungible items. need to generalize
contract ListingSellSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 listingID, uint256 amt) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 merchantID = LibListing.getMerchant(components, listingID);

    require(
      LibNPC.sharesRoomWith(components, merchantID, accountID),
      "Listing.Sell(): must be in same room as npc"
    );
    require(
      LibListing.getSellPrice(components, listingID) != 0,
      "Listing.Sell(): invalid listing!"
    );

    uint256 price = LibListing.getSellPrice(components, listingID);
    LibListing.sellTo(components, listingID, accountID, amt);

    // standard logging and tracking
    LibListing.logIncItemSell(
      components,
      accountID,
      LibListing.getItemIndex(components, listingID),
      amt
    );
    LibListing.logEarnCoin(components, accountID, amt * price);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 listingID, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(listingID, amt));
  }
}
