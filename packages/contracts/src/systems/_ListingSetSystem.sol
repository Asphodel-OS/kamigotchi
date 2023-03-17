// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibListing } from "libraries/LibListing.sol";
import { LibMerchant } from "libraries/LibMerchant.sol";

uint256 constant ID = uint256(keccak256("system._Listing.Set"));

// _ListingSetSystem creates or updates a listing on a merchant by its location
// this assumes a merchant exists at the specified location
contract _ListingSetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 location, uint256 itemIndex, uint256 buyPrice, uint256 sellPrice) = abi.decode(
      arguments,
      (uint256, uint256, uint256, uint256)
    );

    uint256 merchantID = LibMerchant.getAtLocation(components, location);
    uint256 id = LibListing.get(components, merchantID, itemIndex);
    if (id == 0) {
      id = LibListing.create(world, components, merchantID, itemIndex, buyPrice, sellPrice);
    }
    return abi.encode(id);
  }

  function executeTyped(
    uint256 location,
    uint256 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(location, itemIndex, buyPrice, sellPrice));
  }
}
