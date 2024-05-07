// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.Listing.Buy"));

// ListingBuySystem allows a account to buy an item listed with a merchant (npc)
// NOTE: this currently assumes all purchases are for fungible items. need to generalize
contract ListingBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 listingID, uint256 amt) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 merchantID = LibListing.getMerchant(components, listingID);

    require(
      LibNPC.sharesRoomWith(components, merchantID, accountID),
      "Listing.Buy(): must be in same room as npc"
    );
    require(
      LibListing.getBuyPrice(components, listingID) != 0,
      "Listing.Buy(): invalid listing!!!"
    );

    // create an inventory for the account first if one doesn't exist
    uint32 itemIndex = LibListing.getItemIndex(components, listingID);
    if (LibInventory.get(components, accountID, itemIndex) == 0)
      LibInventory.create(components, accountID, itemIndex);
    uint256 price = LibListing.getBuyPrice(components, listingID);
    LibListing.buyFrom(components, listingID, accountID, amt);

    // standard logging and tracking
    LibInventory.logIncItemTotal(components, accountID, itemIndex, amt);
    LibListing.logEarnCoin(components, accountID, amt * price);
    LibListing.logIncItemBuy(components, accountID, itemIndex, amt);
    LibScore.inc(components, accountID, "TOTAL_SPENT", amt * price);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 listingID, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(listingID, amt));
  }
}
