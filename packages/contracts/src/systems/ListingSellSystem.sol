// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibNPC } from "libraries/LibNPC.sol";

uint256 constant ID = uint256(keccak256("system.Listing.Sell"));

// ListingSellSystem allows a character to buy an item listed with a merchant (npc)
// NOTE: this currently assumes all purchases are for fungible items. need to generalize
contract ListingSellSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    (uint32 merchantIndex, uint32[] memory itemIndices, uint32[] memory amts) = abi.decode(
      arguments,
      (uint32, uint32[], uint32[])
    );
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);
    uint256 merchantID = LibNPC.get(components, merchantIndex);
    require(merchantID != 0, "merchant does not exist");
    require(
      LibNPC.sharesRoomWith(components, merchantID, accountID),
      "Listing.Sell(): must be in same room as npc"
    );

    uint256 total;
    for (uint256 i; i < itemIndices.length; i++) {
      uint256 listingID = LibListing.get(components, merchantIndex, itemIndices[i]);
      require(listingID != 0, "listing does not exist");

      total += LibListing.sell(components, listingID, accountID, itemIndices[i], amts[i]);
      LibListing.logIncItemSell(components, accountID, itemIndices[i], amts[i]);
    }

    // standard logging and tracking
    LibListing.logEarnCoin(components, accountID, total);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(
    uint32 merchantIndex,
    uint32[] memory itemIndices,
    uint32[] memory amts
  ) public notPaused returns (bytes memory) {
    return execute(abi.encode(merchantIndex, itemIndices, amts));
  }
}
