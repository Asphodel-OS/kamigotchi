// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibData } from "libraries/LibData.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibListingRegistry } from "libraries/LibListingRegistry.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibScore } from "libraries/LibScore.sol";

uint256 constant ID = uint256(keccak256("system.listing.buy"));

// ListingBuySystem allows a account to buy an item listed with a merchant (npc)
// NOTE: this currently assumes all purchases are for fungible items. need to generalize
contract ListingBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 merchantIndex, uint32[] memory itemIndices, uint32[] memory amts) = abi.decode(
      arguments,
      (uint32, uint32[], uint32[])
    );
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 merchantID = LibNPC.get(components, merchantIndex);
    if (merchantID == 0) revert("merchant does not exist");
    LibNPC.verifyRoom(components, merchantID, accID);

    for (uint256 i; i < itemIndices.length; i++) {
      uint256 listingID = LibListingRegistry.get(components, merchantIndex, itemIndices[i]);
      require(listingID != 0, "listing does not exist");
      if (listingID == 0) revert("listing does not exist");
      LibListing.verifyRequirements(components, listingID, accID);

      (uint32 currency, uint256 spent) = LibListing.buy(
        components,
        listingID,
        accID,
        itemIndices[i],
        amts[i]
      );
      LibListing.logBuy(
        world,
        components,
        accID,
        LibListing.LogData(merchantIndex, itemIndices[i], amts[i], currency, spent)
      );
      LibScore.incFor(components, accID, currency, "TOTAL_SPENT", spent);
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(
    uint32 merchantIndex,
    uint32[] memory itemIndices,
    uint32[] memory amts
  ) public returns (bytes memory) {
    return execute(abi.encode(merchantIndex, itemIndices, amts));
  }
}
