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
    (string memory name, uint256 itemIndex, uint256 buyPrice, uint256 sellPrice) = abi.decode(
      arguments,
      (string, uint256, uint256, uint256)
    );
    uint256 merchantID = LibMerchant.getByName(components, name);

    require(merchantID != 0, "Merchant: does not exist");

    uint256 id = LibListing.get(components, merchantID, itemIndex);
    if (id == 0) LibListing.create(world, components, merchantID, itemIndex, buyPrice, sellPrice);
    else LibListing.update(components, id, buyPrice, sellPrice);
    return "";
  }

  function executeTyped(
    string memory name,
    uint256 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(name, itemIndex, buyPrice, sellPrice));
  }
}
