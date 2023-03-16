// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibListing } from "libraries/LibListing.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { Utils } from "utils/Utils.sol";

uint256 constant ID = uint256(keccak256("system.ListingSell"));

// ListingSellSystem allows a character to buy an item listed with a merchant
contract ListingSellSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 listingID, uint256 amt) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    uint256 merchantID = LibListing.getMerchant(components, listingID);

    require(Utils.sameRoom(components, merchantID, accountID), "Merchant: must be in room");

    LibListing.sellTo(components, listingID, accountID, amt);
    Utils.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 listingID, uint256 amt) public returns (bytes memory) {
    return execute(abi.encode(listingID, amt));
  }
}
