// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibListing } from "libraries/LibListing.sol";
import { LibMerchant } from "libraries/LibMerchant.sol";

uint256 constant ID = uint256(keccak256("system._Listing.Set"));

// create or update a Listing on a Merchant by its Merchnat Index
contract _ListingSetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint256 merchantIndex, uint256 itemIndex, uint256 buyPrice, uint256 sellPrice) = abi.decode(
      arguments,
      (uint256, uint256, uint256, uint256)
    );
    uint256 merchantID = LibMerchant.getByIndex(components, merchantIndex);
    require(merchantID != 0, "Merchant: does not exist");

    uint256 id = LibListing.get(components, merchantID, itemIndex);
    if (id == 0) LibListing.create(world, components, merchantID, itemIndex, buyPrice, sellPrice);
    else LibListing.update(components, id, buyPrice, sellPrice);
    return "";
  }

  function executeTyped(
    uint256 merchantIndex,
    uint256 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(merchantIndex, itemIndex, buyPrice, sellPrice));
  }
}
