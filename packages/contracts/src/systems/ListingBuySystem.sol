// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibMerchant } from "libraries/LibMerchant.sol";

uint256 constant ID = uint256(keccak256("system.Listing.Buy"));

// ListingBuySystem allows a account to buy an item listed with a merchant
// NOTE: this currently assumes all purchases are for fungible items. need to generalize
contract ListingBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 listingID, uint256 amt) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 merchantID = LibListing.getMerchant(components, listingID);

    require(accountID != 0, "Account: not found");
    require(
      LibMerchant.sharesRoomWith(components, merchantID, accountID),
      "Listing.Buy(): must be in same room as merchant"
    );
    require(
      LibListing.getBuyPrice(components, listingID) != 0,
      "Listing.Buy(): invalid listing!!!"
    );

    // create an inventory for the account first if one doesn't exist
    uint256 itemIndex = LibListing.getItemIndex(components, listingID);
    if (LibInventory.get(components, accountID, itemIndex) == 0) {
      LibInventory.create(world, components, accountID, itemIndex);
    }
    LibListing.buyFrom(components, listingID, accountID, amt);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 listingID, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(listingID, amt));
  }
}
